/* ============================================================
   cart-page.js — renders cart items, supports add/remove/qty
   Cart items may have variant_id, flavor_en/ar, weight.
   ============================================================ */

let PRODUCTS_INDEX = {};

function emptyCartHtml() {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"/></svg>
      <p style="margin-bottom:18px;color:#888;" data-i18n="cart_empty">Your cart is currently empty</p>
      <a href="index.html" class="btn btn-dark" data-i18n="continue_shopping">Continue shopping</a>
    </div>`;
}

// Resolve the stock_qty limit for a cart item (null = unlimited)
function itemStockQty(item, p) {
  if (item.variant_id && p.flavors) {
    for (const f of p.flavors) {
      const v = (f.variants || []).find(v => v.id === item.variant_id);
      if (v) return v.stock_qty ?? null;
    }
  }
  return p.stock_qty ?? null;
}

// Resolve the price for a cart item — use variant price when available
function itemPrice(item, p) {
  if (item.variant_id && p.flavors) {
    for (const f of p.flavors) {
      const v = f.variants.find(v => v.id === item.variant_id);
      if (v) return v.price;
    }
  }
  return p.price;
}

// Resolve the image for a cart item
function itemImage(item, p) {
  if (item.variant_id && p.flavors) {
    for (const f of p.flavors) {
      const v = f.variants.find(v => v.id === item.variant_id);
      if (v && v.image) return v.image;
    }
  }
  return p.image;
}

// Small label shown under the product name (e.g. "Natural · 300g")
function variantLabel(item, lang) {
  const parts = [];
  if (item.flavor_en || item.flavor_ar) {
    parts.push(lang === "ar" ? (item.flavor_ar || item.flavor_en) : item.flavor_en);
  }
  if (item.weight) parts.push(item.weight);
  return parts.join(" · ");
}

function renderCartPage(lang) {
  const root  = document.getElementById("cart-root");
  const items = Cart.get();

  if (!items.length) { root.innerHTML = emptyCartHtml(); Lang.apply(); return; }

  let total = 0;
  const rows = items.map((item, idx) => {
    const p = PRODUCTS_INDEX[item.product_id];
    if (!p) return "";
    const price     = itemPrice(item, p);
    const lineTotal = price * item.qty;
    total += lineTotal;
    const label = variantLabel(item, lang);
    const img   = itemImage(item, p);
    const vid   = item.variant_id ?? "null";
    return `
      <div class="cart-item">
        <img src="${img}" alt="${p.name[lang]}" onerror="this.src='https://placehold.co/100x100/0d0d0d/ffffff?text=HN'">
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name[lang]}</div>
          ${label ? `<div style="font-size:12px;color:#888;margin-top:2px;">${label}</div>` : ""}
          <div class="cart-item-price">${price.toLocaleString()} <span>${Lang.t("da")}</span></div>
          <div class="qty-control" style="margin-top:8px;">
            <button type="button" data-decr="${idx}">−</button>
            <input type="number" min="1" value="${item.qty}" data-qty="${idx}">
            <button type="button" data-incr="${idx}">+</button>
          </div>
        </div>
        <div style="text-align:end;">
          <div style="font-weight:800;margin-bottom:10px;">${lineTotal.toLocaleString()} <span>${Lang.t("da")}</span></div>
          <button class="cart-item-remove" data-remove="${idx}">${Lang.t("remove")}</button>
        </div>
      </div>`;
  }).join("");

  root.innerHTML = `
    <div class="cart-layout">
      <div>${rows}</div>
      <div class="cart-summary">
        <div class="summary-row total"><span>${Lang.t("total")}</span><span>${total.toLocaleString()} <span>${Lang.t("da")}</span></span></div>
        <a href="checkout.html" class="btn btn-primary btn-block">${Lang.t("proceed_checkout")}</a>
      </div>
    </div>`;

  // Wire buttons using index so we identify the exact cart item (handles duplicate products with different variants)
  root.querySelectorAll("[data-incr]").forEach(btn => btn.addEventListener("click", () => {
    const idx  = Number(btn.getAttribute("data-incr"));
    const item = Cart.get()[idx];
    if (!item) return;
    const maxQty = PRODUCTS_INDEX[item.product_id] ? itemStockQty(item, PRODUCTS_INDEX[item.product_id]) : null;
    const newQty = item.qty + 1;
    if (maxQty !== null && newQty > maxQty) return;
    Cart.setQty(item.product_id, newQty, item.variant_id ?? null);
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-decr]").forEach(btn => btn.addEventListener("click", () => {
    const idx  = Number(btn.getAttribute("data-decr"));
    const item = Cart.get()[idx];
    if (item) Cart.setQty(item.product_id, item.qty - 1, item.variant_id ?? null);
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-qty]").forEach(input => input.addEventListener("change", () => {
    const idx  = Number(input.getAttribute("data-qty"));
    const item = Cart.get()[idx];
    if (!item) return;
    const maxQty = PRODUCTS_INDEX[item.product_id] ? itemStockQty(item, PRODUCTS_INDEX[item.product_id]) : null;
    let newQty = Math.max(1, Number(input.value) || 1);
    if (maxQty !== null) newQty = Math.min(newQty, maxQty);
    Cart.setQty(item.product_id, newQty, item.variant_id ?? null);
    renderCartPage(Lang.get());
  }));
  root.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => {
    const idx  = Number(btn.getAttribute("data-remove"));
    const item = Cart.get()[idx];
    if (item) Cart.remove(item.product_id, item.variant_id ?? null);
    renderCartPage(Lang.get());
  }));
}

async function initCartPage() {
  const products = await Api.getProducts();
  PRODUCTS_INDEX = Object.fromEntries(products.map(p => [p.id, p]));

  // Purge items whose products have been deleted from the store
  const validIds = new Set(products.map(p => p.id));
  const before = Cart.get();
  const after  = before.filter(i => validIds.has(i.product_id));
  if (after.length !== before.length) Cart.save(after);

  renderCartPage(Lang.get());
}

document.addEventListener("DOMContentLoaded", initCartPage);
document.addEventListener("langchange", e => renderCartPage(e.detail.lang));
