/* ============================================================
   checkout.js — order form (nom, prenom, adresse, email, phone)
   validates client-side, then calls Api.submitOrder()
   ============================================================ */

let CHECKOUT_PRODUCTS = {};

function formHtml(lang) {
  return `
    <div class="checkout-layout">
      <div class="form-card" id="order-form-wrap">
        <div class="form-row">
          <div class="form-group" id="g-prenom">
            <label data-i18n="first_name">First name</label>
            <input type="text" id="f-prenom" name="prenom" autocomplete="given-name">
            <div class="error-msg" data-i18n="required_field">This field is required</div>
          </div>
          <div class="form-group" id="g-nom">
            <label data-i18n="last_name">Last name</label>
            <input type="text" id="f-nom" name="nom" autocomplete="family-name">
            <div class="error-msg" data-i18n="required_field">This field is required</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" id="g-wilaya">
            <label data-i18n="state">State (Wilaya)</label>
            <input type="text" id="f-wilaya" name="wilaya" autocomplete="address-level1">
            <div class="error-msg" data-i18n="required_field">This field is required</div>
          </div>
          <div class="form-group" id="g-commune">
            <label data-i18n="municipality">Municipality (Commune)</label>
            <input type="text" id="f-commune" name="commune" autocomplete="address-level2">
            <div class="error-msg" data-i18n="required_field">This field is required</div>
          </div>
        </div>

        <div class="form-group" id="g-adresse">
          <label data-i18n="address_optional">Address (optional — for home delivery)</label>
          <textarea id="f-adresse" name="adresse" rows="2"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group" id="g-email">
            <label data-i18n="email">Email</label>
            <input type="email" id="f-email" name="email" autocomplete="email">
            <div class="error-msg" data-i18n="invalid_email">Invalid email address</div>
          </div>
          <div class="form-group" id="g-phone">
            <label data-i18n="phone">Phone number</label>
            <input type="tel" id="f-phone" name="telephone" autocomplete="tel" placeholder="05/06/07 XX XX XX XX">
            <div class="error-msg" data-i18n="invalid_phone">Invalid phone number</div>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="submit-order-btn" data-i18n="place_order">Place Order</button>
      </div>

      <div class="order-summary-card">
        <h3 style="margin-bottom:14px;" data-i18n="order_summary">Order Summary</h3>
        <div id="summary-items"></div>
        <div class="summary-row total" style="margin-top:14px;">
          <span data-i18n="total">Total</span>
          <span id="summary-total">0 <span data-i18n="da">DZD</span></span>
        </div>
      </div>
    </div>`;
}

function resolveVariantPrice(item, p) {
  if (item.variant_id && p.flavors) {
    for (const f of p.flavors) {
      const v = (f.variants || []).find(v => v.id === item.variant_id);
      if (v) return v.price;
    }
  }
  return p.price;
}

function renderSummary(lang) {
  const items = Cart.get();
  const wrap = document.getElementById("summary-items");
  if (!wrap) return;
  let total = 0;
  wrap.innerHTML = items.map(item => {
    const p = CHECKOUT_PRODUCTS[item.product_id];
    if (!p) return "";
    const price = resolveVariantPrice(item, p);
    const lineTotal = price * item.qty;
    total += lineTotal;
    const flavorLabel = lang === "ar" ? (item.flavor_ar || item.flavor_en) : (item.flavor_en || item.flavor_ar);
    const detail = [flavorLabel, item.weight].filter(Boolean).join(" · ");
    return `<div class="summary-item">
      <span>${p.name[lang]} × ${item.qty}${detail ? `<div style="font-size:11px;color:#888;margin-top:2px;">${detail}</div>` : ""}</span>
      <span>${lineTotal.toLocaleString()}</span>
    </div>`;
  }).join("");
  const totalEl = document.getElementById("summary-total");
  if (totalEl) totalEl.innerHTML = `${total.toLocaleString()} <span>${Lang.t("da")}</span>`;
}

function setError(groupId, show) {
  const el = document.getElementById(groupId);
  if (el) el.classList.toggle("has-error", show);
}

function validateForm() {
  let valid = true;
  const prenom  = document.getElementById("f-prenom").value.trim();
  const nom     = document.getElementById("f-nom").value.trim();
  const wilaya  = document.getElementById("f-wilaya").value.trim();
  const commune = document.getElementById("f-commune").value.trim();
  const adresse = document.getElementById("f-adresse").value.trim(); // optional
  const email   = document.getElementById("f-email").value.trim();
  const phone   = document.getElementById("f-phone").value.trim();

  setError("g-prenom",  !prenom);  if (!prenom)  valid = false;
  setError("g-nom",     !nom);     if (!nom)      valid = false;
  setError("g-wilaya",  !wilaya);  if (!wilaya)   valid = false;
  setError("g-commune", !commune); if (!commune)  valid = false;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setError("g-email", !emailOk); if (!emailOk) valid = false;

  const phoneOk = /^0[5-7][0-9]{8}$/.test(phone.replace(/\s/g, ""));
  setError("g-phone", !phoneOk); if (!phoneOk) valid = false;

  return valid ? { prenom, nom, wilaya, commune, adresse, email, telephone: phone } : null;
}

function showSuccessScreen(lang, orderId) {
  document.getElementById("checkout-root").innerHTML = `
    <div class="success-screen">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h2 style="margin-bottom:10px;" data-i18n="order_success_title">Order received!</h2>
      <p style="color:#888;margin-bottom:8px;" data-i18n="order_success_text">We'll call you shortly to confirm delivery.</p>
      <p style="color:#bbb;font-size:13px;margin-bottom:24px;">#${orderId}</p>
      <a href="index.html" class="btn btn-dark" data-i18n="back_home">Back to home</a>
    </div>`;
  Lang.apply();
}

async function handleSubmit() {
  const data = validateForm();
  if (!data) return;

  const btn = document.getElementById("submit-order-btn");
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "...";

  try {
    const items = Cart.get().map(i => ({
      product_id: i.product_id,
      variant_id: i.variant_id || null,
      flavor:     i.flavor_en  || "",
      weight:     i.weight     || "",
      qty:        i.qty
    }));
    const result = await Api.submitOrder({ ...data, items });
    Cart.clear();
    showSuccessScreen(Lang.get(), result.order_id);
  } catch (err) {
    alert("Error: " + err.message);
    btn.disabled = false;
    btn.textContent = original;
  }
}

async function initCheckout() {
  const root = document.getElementById("checkout-root");
  const items = Cart.get();

  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <p style="margin-bottom:18px;color:#888;" data-i18n="cart_empty">Your cart is currently empty</p>
        <a href="index.html" class="btn btn-dark" data-i18n="continue_shopping">Continue shopping</a>
      </div>`;
    Lang.apply();
    return;
  }

  const products = await Api.getProducts();
  CHECKOUT_PRODUCTS = Object.fromEntries(products.map(p => [p.id, p]));

  root.innerHTML = formHtml(Lang.get());
  Lang.apply();
  renderSummary(Lang.get());
  document.getElementById("submit-order-btn").addEventListener("click", handleSubmit);
}

document.addEventListener("DOMContentLoaded", initCheckout);
document.addEventListener("langchange", (e) => {
  if (document.getElementById("summary-items")) renderSummary(e.detail.lang);
});
