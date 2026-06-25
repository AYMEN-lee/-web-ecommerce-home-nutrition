/* ============================================================
   cart.js — manages the shopping cart (add / remove / qty)
   Persists in localStorage so it survives page navigation.
   ============================================================ */

const Cart = {
  KEY: "hn_cart",

  get() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    Cart.updateBadge();
  },

  add(productId, qty = 1) {
    const items = Cart.get();
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ product_id: productId, qty });
    }
    Cart.save(items);
  },

  remove(productId) {
    const items = Cart.get().filter(i => i.product_id !== productId);
    Cart.save(items);
  },

  setQty(productId, qty) {
    const items = Cart.get();
    const item = items.find(i => i.product_id === productId);
    if (!item) return;
    if (qty <= 0) {
      Cart.remove(productId);
      return;
    }
    item.qty = qty;
    Cart.save(items);
  },

  clear() {
    Cart.save([]);
  },

  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },

  updateBadge() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = Cart.count();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Cart.updateBadge());
