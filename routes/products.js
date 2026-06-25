const express = require("express");
const { db, rowToProduct } = require("../db");
const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY id ASC").all();
  res.json(rows.map(rowToProduct));
});

// GET /api/products/:slug
router.get("/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE slug = ? OR id = ?").get(req.params.slug, req.params.slug);
  if (!row) return res.status(404).json({ error: "Product not found" });
  res.json(rowToProduct(row));
});

module.exports = router;
