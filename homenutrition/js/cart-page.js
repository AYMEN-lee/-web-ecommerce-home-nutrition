/* ============================================================
   cart-page.js — renders cart items, supports add/remove/qty
   ============================================================ */

let PRODUCTS_INDEX = {};

function emptyCartHtml(lang) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"/></svg>
      <p style="margin-bottom:18px;color:#888;" data-i18n="cart_empty">Your cart is currently empty</p>
      <a href="index.html" class="btn btn-dark" data-i18n="continue_shopping">Continue shopping</a>
    </div>`;
}

function renderCartPage(lang) {
  const root = document.getElementById("cart-root");
  const items = Cart.get();

  if (!items.length) {
    root.innerHTML = emptyCartHtml(lang);
    return;
  }

  let total = 0;
  const rows = items.map(item => {
    const p = PRODUCTS_INDEX[item.product_id];
    if (!p) return "";
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name[lang]}" onerror="this.src='https://placehold.co/100x100/0d0d0d/ffffff?text=HN'">
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name[lang]}</div>
          <div class="cart-item-price">${p.price.toLocaleString()} <span data-i18n="da">DZD</span></div>
          <div class="qty-control" style="margin-top:8px;">
            <button type="button" data-decr="${p.id}">−</button>
            <input type="number" min="1" value="${item.qty}" data-qty="${p.id}">
            <button type="button" data-incr="${p.id}">+</button>
          </div>
        </div>
        <div style="text-align:end;">
          <div style="font-weight:800;margin-bottom:10px;">${lineTotal.toLocaleString()} <span data-i18n="da">DZD</span></div>
          <button class="cart-item-remove" data-remove="${p.id}" data-i18n="remove">Remove</button>
        </div>
      </div>`;
  }).join("");

  root.innerHTML = `
    <div class="cart-layout">
      <div>${rows}</div>
      <div class="cart-summary">
        <div class="summary-row"><span data-i18n="total">Total</span><span>${total.toLocaleString()} <span data-i18n="da">DZD</span></span></div>
        <div class="summary-row total"><span data-i18n="total">Total</span><span>${total.toLocaleString()} <span data-i18n="da">DZD</span></span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" data-i18n="proceed_checkout">Proceed to Checkout</a>
      </div>
    </div>`;

  root.querySelectorAll("[data-incr]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.getAttribute("data-incr"));
    const item = Cart.get().find(i => i.product_id === id);
    Cart.setQty(id, (item?.qty || 0) + 1);
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-decr]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.getAttribute("data-decr"));
    const item = Cart.get().find(i => i.product_id === id);
    Cart.setQty(id, (item?.qty || 0) - 1);
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-qty]").forEach(input => input.addEventListener("change", () => {
    const id = Number(input.getAttribute("data-qty"));
    Cart.setQty(id, Math.max(1, Number(input.value) || 1));
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => {
    Cart.remove(Number(btn.getAttribute("data-remove")));
    renderCartPage(Lang.get());
  }));
}

async function initCartPage() {
  const products = await Api.getProducts();
  PRODUCTS_INDEX = Object.fromEntries(products.map(p => [p.id, p]));
  renderCartPage(Lang.get());
}

document.addEventListener("DOMContentLoaded", initCartPage);
document.addEventListener("langchange", (e) => renderCartPage(e.detail.lang));
