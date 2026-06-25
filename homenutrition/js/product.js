/* ============================================================
   product.js — single product detail + add to cart
   ============================================================ */

function starsSvgPD(rating) {
  let h = "";
  for (let i = 0; i < 5; i++) {
    h += `<svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" fill="${i < rating ? '#f3b13a' : '#e4e3e0'}"/></svg>`;
  }
  return h;
}

let CURRENT_PRODUCT = null;

function renderProduct(p, lang) {
  const bcCat = document.getElementById("bc-cat");
  if (bcCat) bcCat.textContent = p.category[lang];

  const isPages = window.location.pathname.includes("/pages/");
  const imgPrefix = isPages ? "../" : "";

  document.getElementById("pd-root").innerHTML = `
    <div class="pd-layout">
      <div class="pd-image">
        <img src="${imgPrefix}${p.image}" alt="${p.name[lang]}"
             onerror="this.src='https://placehold.co/600x600/0d0d0d/ffffff?text=${encodeURIComponent(p.name[lang])}'">
      </div>
      <div class="pd-body">
        <div class="product-cat">${p.category[lang]}</div>
        <h1 class="pd-title">${p.name[lang]}</h1>
        <div class="product-rating" style="margin-bottom:10px;">${starsSvgPD(p.rating)}</div>

        <div class="pd-price-row">
          <span class="pd-price">${p.price.toLocaleString()} <span data-i18n="da">DZD</span></span>
          ${p.old_price ? `<span class="price-old">${p.old_price.toLocaleString()}</span>` : ""}
        </div>

        <div class="qty-control" style="margin-bottom:16px;">
          <button id="qty-minus" type="button">−</button>
          <input type="number" id="qty-input" value="1" min="1">
          <button id="qty-plus" type="button">+</button>
        </div>

        <div class="pd-actions">
          <button class="btn btn-dark" id="add-to-cart-btn" data-i18n="add_to_cart">Add To Cart</button>
          <a class="btn btn-primary" id="buy-now-btn"
             href="${isPages ? '../' : ''}checkout.html" data-i18n="buy_now">Buy Now</a>
        </div>

        <hr style="border:none;border-top:1px solid var(--line);margin:18px 0;">
        <h3 style="margin-bottom:8px;font-size:15px;" data-i18n="description">Description</h3>
        <p class="pd-desc">${p.description[lang]}</p>
      </div>
    </div>`;

  // Qty controls
  document.getElementById("qty-minus").addEventListener("click", () => {
    const inp = document.getElementById("qty-input");
    inp.value = Math.max(1, Number(inp.value) - 1);
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    const inp = document.getElementById("qty-input");
    inp.value = Number(inp.value) + 1;
  });

  // Add to cart
  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    const qty = Number(document.getElementById("qty-input").value) || 1;
    Cart.add(p.id, qty);
    const btn = document.getElementById("add-to-cart-btn");
    btn.textContent = lang === "ar" ? "✓ أُضيف" : "✓ Added";
    btn.style.background = "var(--forge)";
    setTimeout(() => {
      btn.textContent = Lang.t("add_to_cart");
      btn.style.background = "";
    }, 1400);
  });

  // Buy now — add to cart then navigate
  document.getElementById("buy-now-btn").addEventListener("click", () => {
    const qty = Number(document.getElementById("qty-input").value) || 1;
    Cart.add(p.id, qty);
  });
}

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const root = document.getElementById("pd-root");
  try {
    CURRENT_PRODUCT = await Api.getProduct(slug);
    renderProduct(CURRENT_PRODUCT, Lang.get());
  } catch {
    root.innerHTML = `<p style="text-align:center;padding:60px;color:var(--steel);">Product not found.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initProductPage);
document.addEventListener("langchange", e => {
  if (CURRENT_PRODUCT) renderProduct(CURRENT_PRODUCT, e.detail.lang);
});
