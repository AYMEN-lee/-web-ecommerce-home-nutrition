const express = require("express");
const { db, rowToProduct, getFlavors } = require("../db");
const router = express.Router();

// Compute the display price/image/in_stock from variants (for the shop grid)
function applyVariantDefaults(product, flavors) {
  if (!flavors.length) return product;
  const allVariants = flavors.flatMap(f => f.variants);
  if (!allVariants.length) return product;
  const first = allVariants[0];
  return {
    ...product,
    price: first.price,
    old_price: first.old_price,
    image: first.image || product.image,
    in_stock: allVariants.some(v => v.in_stock),
    has_variants: true
  };
}

// ── routes ────────────────────────────────────────────────────────────────────

// GET /api/products
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY id ASC").all();
  const result = rows.map(row => {
    const base = rowToProduct(row);
    const flavors = getFlavors(row.id);
    return flavors.length
      ? { ...applyVariantDefaults(base, flavors), has_variants: true, flavors }
      : { ...base, has_variants: false, flavors: [] };
  });
  res.json(result);
});

// GET /api/products/:slug
router.get("/:slug", (req, res) => {
  const row = db.prepare(
    "SELECT * FROM products WHERE slug = ? OR id = ?"
  ).get(req.params.slug, req.params.slug);
  if (!row) return res.status(404).json({ error: "Product not found" });

  const base = rowToProduct(row);
  const flavors = getFlavors(row.id);
  if (flavors.length) {
    res.json({ ...applyVariantDefaults(base, flavors), has_variants: true, flavors });
  } else {
    res.json({ ...base, has_variants: false, flavors: [] });
  }
});

module.exports = router;
