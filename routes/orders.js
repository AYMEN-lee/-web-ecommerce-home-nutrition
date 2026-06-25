const express = require("express");
const { db } = require("../db");
const router = express.Router();

// POST /api/orders
router.post("/", (req, res) => {
  const { prenom, nom, adresse, email, telephone, items } = req.body;

  if (!prenom || !nom || !adresse || !email || !telephone || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate phone (Algerian format)
  if (!/^0[5-7][0-9]{8}$/.test(telephone.replace(/\s/g, ""))) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  // Fetch product prices for each item
  let total = 0;
  const resolvedItems = [];
  for (const item of items) {
    const product = db.prepare("SELECT id, price, in_stock FROM products WHERE id = ?").get(item.product_id);
    if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
    if (!product.in_stock) return res.status(400).json({ error: `Product ${item.product_id} is out of stock` });
    const qty = parseInt(item.qty, 10);
    if (!qty || qty < 1) return res.status(400).json({ error: "Invalid quantity" });
    total += product.price * qty;
    resolvedItems.push({ product_id: product.id, qty, unit_price: product.price });
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
