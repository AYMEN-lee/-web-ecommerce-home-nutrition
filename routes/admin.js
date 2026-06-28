const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, rowToProduct, getFlavors, saveFlavors } = require("../db");
const { requireAdmin } = require("../middleware/auth");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ── Image upload setup ───────────────────────────────────────────────────────

const uploadsDir = path.join(__dirname, "..", "uploads", "products");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /image\/(jpeg|png|webp|gif)/.test(file.mimetype));
  }
});

// ── Auth ─────────────────────────────────────────────────────────────────────

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

  const admin = db.prepare("SELECT * FROM admin WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, username: admin.username });
});

// POST /api/admin/change-password
router.post("/change-password", requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  const admin = db.prepare("SELECT * FROM admin WHERE id = ?").get(req.admin.id);
  if (!bcrypt.compareSync(current_password, admin.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  db.prepare("UPDATE admin SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(new_password, 10), req.admin.id);
  res.json({ success: true });
});

// ── Products CRUD ─────────────────────────────────────────────────────────────

// GET /api/admin/products  (includes out-of-stock + variants)
router.get("/products", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY id ASC").all();
  res.json(rows.map(row => {
    const base = rowToProduct(row);
    const flavors = getFlavors(row.id);
    return { ...base, has_variants: flavors.length > 0, flavors };
  }));
});

// GET /api/admin/orders
router.get("/orders", requireAdmin, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  const getItems = db.prepare(`
    SELECT oi.qty, oi.unit_price, oi.variant_id, oi.flavor, oi.weight,
           p.name_ar, p.name_en, p.slug
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `);
  res.json(orders.map(o => ({ ...o, items: getItems.all(o.id) })));
});

// POST /api/admin/orders/:id/confirm
router.post("/orders/:id/confirm", requireAdmin, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "pending") {
    return res.status(400).json({ error: `Order is already ${order.status}` });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);

  db.exec("BEGIN");
  try {
    for (const item of items) {
      if (item.variant_id) {
        const v = db.prepare("SELECT stock_qty FROM product_variants WHERE id = ?").get(item.variant_id);
        if (v && v.stock_qty !== null) {
          if (v.stock_qty < item.qty) {
            db.exec("ROLLBACK");
            return res.status(400).json({ error: "Not enough stock to confirm this order" });
          }
          const newQty = v.stock_qty - item.qty;
          db.prepare("UPDATE product_variants SET stock_qty = ?, in_stock = ? WHERE id = ?")
            .run(newQty, newQty > 0 ? 1 : 0, item.variant_id);
        }
      } else {
        const p = db.prepare("SELECT stock_qty FROM products WHERE id = ?").get(item.product_id);
        if (p && p.stock_qty !== null) {
          if (p.stock_qty < item.qty) {
            db.exec("ROLLBACK");
            return res.status(400).json({ error: "Not enough stock to confirm this order" });
          }
          const newQty = p.stock_qty - item.qty;
          db.prepare("UPDATE products SET stock_qty = ?, in_stock = ? WHERE id = ?")
            .run(newQty, newQty > 0 ? 1 : 0, item.product_id);
        }
      }
    }
    db.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?").run(order.id);
    db.exec("COMMIT");
    res.json({ success: true });
  } catch (e) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/orders/:id/cancel
router.post("/orders/:id/cancel", requireAdmin, (req, res) => {
  const order = db.prepare("SELECT id, status FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "cancelled") return res.status(400).json({ error: "Order is already cancelled" });
  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order.id);
  res.json({ success: true });
});

// DELETE /api/admin/orders/cancelled  — bulk delete all cancelled orders (must be before /:id)
router.delete("/orders/cancelled", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT id FROM orders WHERE status = 'cancelled'").all();
  if (!rows.length) return res.json({ success: true, deleted: 0 });
  db.exec("BEGIN");
  try {
    for (const o of rows) db.prepare("DELETE FROM order_items WHERE order_id = ?").run(o.id);
    const { changes } = db.prepare("DELETE FROM orders WHERE status = 'cancelled'").run();
    db.exec("COMMIT");
    res.json({ success: true, deleted: changes });
  } catch (e) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/orders/:id  — delete a single cancelled order
router.delete("/orders/:id", requireAdmin, (req, res) => {
  const order = db.prepare("SELECT id, status FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "cancelled") return res.status(400).json({ error: "Only cancelled orders can be deleted" });
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(order.id);
    db.prepare("DELETE FROM orders WHERE id = ?").run(order.id);
    db.exec("COMMIT");
    res.json({ success: true });
  } catch (e) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/products
router.post("/products", requireAdmin, (req, res) => {
  const { slug, name_ar, name_en, category_ar, category_en, price, old_price, image, rating, desc_ar, desc_en, in_stock, flavors, stock_qty } = req.body;
  if (!slug || !name_ar || !name_en || !category_ar || !category_en) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  // price is required only when no variants
  const hasFlavors = Array.isArray(flavors) && flavors.length > 0;
  if (!hasFlavors && !price) return res.status(400).json({ error: "Price is required when no variants" });

  const sqty = (stock_qty !== null && stock_qty !== undefined && stock_qty !== "") ? parseInt(stock_qty) : null;

  try {
    db.exec("BEGIN");
    const { lastInsertRowid: productId } = db.prepare(`
      INSERT INTO products (slug, name_ar, name_en, category_ar, category_en, price, old_price, image, rating, desc_ar, desc_en, in_stock, stock_qty)
      VALUES (@slug, @name_ar, @name_en, @category_ar, @category_en, @price, @old_price, @image, @rating, @desc_ar, @desc_en, @in_stock, @stock_qty)
    `).run({
      slug, name_ar, name_en, category_ar, category_en,
      price: parseFloat(price) || 0,
      old_price: old_price ? parseFloat(old_price) : null,
      image: image || "images/products/placeholder.jpg",
      rating: parseFloat(rating) || 5,
      desc_ar: desc_ar || "",
      desc_en: desc_en || "",
      in_stock: hasFlavors ? 1 : (sqty !== null ? (sqty > 0 ? 1 : 0) : (in_stock ? 1 : 0)),
      stock_qty: sqty
    });
    if (hasFlavors) saveFlavors(productId, flavors);
    db.exec("COMMIT");

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    const flavorData = getFlavors(productId);
    res.status(201).json({ ...rowToProduct(row), has_variants: flavorData.length > 0, flavors: flavorData });
  } catch (e) {
    db.exec("ROLLBACK");
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Slug already exists" });
    throw e;
  }
});

// PUT /api/admin/products/:id
router.put("/products/:id", requireAdmin, (req, res) => {
  const { slug, name_ar, name_en, category_ar, category_en, price, old_price, image, rating, desc_ar, desc_en, in_stock, flavors, stock_qty } = req.body;
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const hasFlavors = Array.isArray(flavors) && flavors.length > 0;
  const sqty = (stock_qty !== null && stock_qty !== undefined && stock_qty !== "") ? parseInt(stock_qty) : null;

  db.exec("BEGIN");
  try {
    db.prepare(`
      UPDATE products SET
        slug = @slug, name_ar = @name_ar, name_en = @name_en,
        category_ar = @category_ar, category_en = @category_en,
        price = @price, old_price = @old_price, image = @image,
        rating = @rating, desc_ar = @desc_ar, desc_en = @desc_en, in_stock = @in_stock, stock_qty = @stock_qty
      WHERE id = @id
    `).run({
      id: req.params.id, slug, name_ar, name_en, category_ar, category_en,
      price: parseFloat(price) || 0,
      old_price: old_price ? parseFloat(old_price) : null,
      image: image || "images/products/placeholder.jpg",
      rating: parseFloat(rating) || 5,
      desc_ar: desc_ar || "",
      desc_en: desc_en || "",
      in_stock: hasFlavors ? 1 : (sqty !== null ? (sqty > 0 ? 1 : 0) : (in_stock ? 1 : 0)),
      stock_qty: sqty
    });
    saveFlavors(req.params.id, hasFlavors ? flavors : []);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  const flavorData = getFlavors(req.params.id);
  res.json({ ...rowToProduct(row), has_variants: flavorData.length > 0, flavors: flavorData });
});

// DELETE /api/admin/products/:id
router.delete("/products/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  db.exec("BEGIN");
  try {
    // Delete in FK-safe order: variants first (references both products and flavors),
    // then flavors, then order_items, then the product itself.
    db.prepare("DELETE FROM product_variants WHERE product_id = ?").run(req.params.id);
    db.prepare("DELETE FROM product_flavors WHERE product_id = ?").run(req.params.id);
    db.prepare("DELETE FROM order_items WHERE product_id = ?").run(req.params.id);
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    db.exec("COMMIT");
    res.json({ success: true });
  } catch (e) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/products/:id/image  (attach image to existing product)
router.post("/products/:id/image", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  const imageUrl = `/uploads/products/${req.file.filename}`;
  db.prepare("UPDATE products SET image = ? WHERE id = ?").run(imageUrl, req.params.id);
  res.json({ image: imageUrl });
});

// POST /api/admin/upload-image  (standalone upload — used when adding a new product)
router.post("/upload-image", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  res.json({ image: `/uploads/products/${req.file.filename}` });
});

module.exports = router;
