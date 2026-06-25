/* ============================================================
   cart.js — manages the shopping cart (add / remove / qty)
   Cart item shape:
     { product_id, variant_id (or null), flavor_en, flavor_ar, weight, qty }
   Key = product_id + '_' + (variant_id ?? 'base')
   ============================================================ */

const Cart = {
  KEY: "hn_cart",

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    Cart.updateBadge();
  },

  // variantInfo = { variant_id, flavor_en, flavor_ar, weight } or null
  add(productId, qty = 1, variantInfo = null) {
    const items = Cart.get();
    const variantId = variantInfo?.variant_id ?? null;
    const existing = items.find(i =>
      i.product_id === productId && (i.variant_id ?? null) === variantId
    );
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        product_id: productId,
        variant_id: variantId,
        flavor_en: variantInfo?.flavor_en || "",
        flavor_ar: variantInfo?.flavor_ar || "",
        weight:    variantInfo?.weight    || "",
        qty
      });
    }
    Cart.save(items);
  },

  remove(productId, variantId = null) {
    const nid = variantId ?? null;
    const items = Cart.get().filter(i =>
      !(i.product_id === productId && (i.variant_id ?? null) === nid)
    );
    Cart.save(items);
  },

  setQty(productId, qty, variantId = null) {
    const nid = variantId ?? null;
    if (qty <= 0) { Cart.remove(productId, nid); return; }
    const items = Cart.get();
    const item = items.find(i =>
      i.product_id === productId && (i.variant_id ?? null) === nid
    );
    if (!item) return;
    item.qty = qty;
    Cart.save(items);
  },

  clear() { Cart.save([]); },

  count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },

  updateBadge() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = Cart.count();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Cart.updateBadge());
