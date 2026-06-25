const express = require("express");
const { db } = require("../db");
const router = express.Router();

// POST /api/orders
router.post("/", (req, res) => {
  const { prenom, nom, adresse, email, telephone, items } = req.body;

  if (!prenom || !nom || !adresse || !email || !telephone || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!/^0[5-7][0-9]{8}$/.test(telephone.replace(/\s/g, ""))) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  let total = 0;
  const resolvedItems = [];

  for (const item of items) {
    const qty = parseInt(item.qty, 10);
    if (!qty || qty < 1) return res.status(400).json({ error: "Invalid quantity" });

    if (item.variant_id) {
      // Variant product: price & stock from product_variants
      const variant = db.prepare(
        "SELECT pv.*, p.id as product_id FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id = ?"
      ).get(item.variant_id);
      if (!variant) return res.status(400).json({ error: `Variant ${item.variant_id} not found` });
      if (!variant.in_stock) return res.status(400).json({ error: `Selected variant is out of stock` });
      total += variant.price * qty;
      resolvedItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        flavor: item.flavor || "",
        weight: item.weight || "",
        qty,
        unit_price: variant.price
      });
    } else {
      // Simple product: price & stock from products table
      const product = db.prepare("SELECT id, price, in_stock FROM products WHERE id = ?").get(item.product_id);
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      if (!product.in_stock) return res.status(400).json({ error: `Product ${item.product_id} is out of stock` });
      total += product.price * qty;
      resolvedItems.push({ product_id: product.id, variant_id: null, flavor: "", weight: "", qty, unit_price: product.price });
    }
  }

  const orderRef = "ORD-" + Date.now();

  db.exec("BEGIN");
  try {
    const { lastInsertRowid } = db.prepare(
      "INSERT INTO orders (order_ref, prenom, nom, adresse, email, telephone, total) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(orderRef, prenom, nom, adresse, email, telephone, total);

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)"
    );
    for (const item of resolvedItems) {
      insertItem.run(lastInsertRowid, item.product_id, item.qty, item.unit_price);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.json({ success: true, order_id: orderRef });
});

module.exports = router;
