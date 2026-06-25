/* ============================================================
   product.js — product detail page with optional variant selector
   ============================================================ */

function starsSvgPD(rating) {
  let h = "";
  for (let i = 0; i < 5; i++) {
    h += `<svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" fill="${i < rating ? '#f3b13a' : '#e4e3e0'}"/></svg>`;
  }
  return h;
}

let CURRENT_PRODUCT = null;
let selectedFlavorIdx = 0;
let selectedVariantIdx = 0;

// ── helpers ──────────────────────────────────────────────────────────────────

function resolvedImgSrc(imagePath, isPages) {
  if (!imagePath) return "";
  if (imagePath.startsWith("/") || imagePath.startsWith("http")) return imagePath;
  return (isPages ? "../" : "") + imagePath;
}

function currentVariant() {
  const p = CURRENT_PRODUCT;
  if (!p || !p.has_variants) return null;
  const flavor = p.flavors[selectedFlavorIdx];
  if (!flavor) return null;
  return flavor.variants[selectedVariantIdx] || null;
}

// ── render ───────────────────────────────────────────────────────────────────

function renderProduct(p, lang) {
  const bcCat = document.getElementById("bc-cat");
  if (bcCat) bcCat.textContent = p.category[lang];

  const isPages = window.location.pathname.includes("/pages/");
  const defaultImg = resolvedImgSrc(p.image, isPages);
  const showArrows = p.has_variants && p.flavors.length > 1;

  document.getElementById("pd-root").innerHTML = `
    <div class="pd-layout">
      <div class="pd-image">
        ${showArrows ? `<button class="img-arrow img-arrow-prev" id="img-prev" aria-label="Previous flavor">&#8249;</button>` : ""}
        <img id="pd-img" src="${defaultImg}" alt="${p.name[lang]}"
             onerror="this.style.display='none'">
        ${showArrows ? `<button class="img-arrow img-arrow-next" id="img-next" aria-label="Next flavor">&#8250;</button>` : ""}
      </div>
      <div class="pd-body">
        <div class="product-cat">${p.category[lang]}</div>
        <h1 class="pd-title">${p.name[lang]}</h1>
        <div class="product-rating" style="margin-bottom:10px;">${starsSvgPD(p.rating)}</div>

        <div class="pd-price-row" id="pd-price-row">
          <span class="pd-price" id="pd-price">${p.price.toLocaleString()} <span>${Lang.t("da")}</span></span>
          ${p.old_price ? `<span class="price-old" id="pd-old-price">${p.old_price.toLocaleString()}</span>` : `<span id="pd-old-price" style="display:none;"></span>`}
        </div>

        ${p.has_variants ? renderVariantSelector(p, lang) : ""}

        <div class="qty-control" style="margin-bottom:16px;">
          <button id="qty-minus" type="button">−</button>
          <input type="number" id="qty-input" value="1" min="1">
          <button id="qty-plus" type="button">+</button>
        </div>

        <div id="pd-stock-label" style="font-size:13px;margin-bottom:12px;"></div>

        <div class="pd-actions">
          <button class="btn btn-dark" id="add-to-cart-btn">${Lang.t("add_to_cart")}</button>
          <a class="btn btn-primary" id="buy-now-btn"
             href="${isPages ? '../' : ''}checkout.html">${Lang.t("buy_now")}</a>
        </div>

        <hr style="border:none;border-top:1px solid var(--line);margin:18px 0;">
        <h3 style="margin-bottom:8px;font-size:15px;">${Lang.t("description")}</h3>
        <p class="pd-desc">${p.description[lang]}</p>
      </div>
    </div>`;

  wireQtyControls();
  wireCartButtons(p, lang, isPages);

  if (p.has_variants) {
    wireVariantSelector(p, lang, isPages);
    // Show stock for the first variant — don't auto-swap the main product image
    const firstVariant = p.flavors[0]?.variants?.[0];
    if (firstVariant) {
      updateStockLabel(firstVariant.in_stock, lang);
      const cartBtn = document.getElementById("add-to-cart-btn");
      if (cartBtn) cartBtn.disabled = !firstVariant.in_stock;
    } else {
      updateStockLabel(p.in_stock, lang);
    }
  } else {
    updateStockLabel(p.in_stock, lang);
  }
}

// ── variant selector HTML ─────────────────────────────────────────────────────

function renderVariantSelector(p, lang) {
  const flavorBtns = p.flavors.map((f, fi) => {
    const label = (f.name[lang] || "").replace(/"/g, "&quot;");
    const color = f.color || "#cccccc";
    return `<button class="flavor-circle ${fi === selectedFlavorIdx ? "active" : ""}"
      data-fi="${fi}" title="${label}"
      style="--fc:${color};"></button>`;
  }).join("");

  const flavor = p.flavors[selectedFlavorIdx] || p.flavors[0];
  const weightBtns = (flavor?.variants || []).map((v, vi) =>
    `<button class="variant-btn ${vi === selectedVariantIdx ? "active" : ""} ${v.in_stock ? "" : "out-of-stock"}" data-vi="${vi}">${v.weight}</button>`
  ).join("");

  return `
    <div class="variant-section" style="margin-bottom:16px;">
      <div class="variant-label">${Lang.t("flavor")}</div>
      <div class="variant-row" id="flavor-btns">${flavorBtns}</div>
      <div class="variant-label" style="margin-top:10px;">${Lang.t("weight")}</div>
      <div class="variant-row" id="weight-btns">${weightBtns}</div>
    </div>`;
}

// ── wire variant selector events ──────────────────────────────────────────────

function wireVariantSelector(p, lang, isPages) {
  // Flavor circles — event delegation
  document.getElementById("flavor-btns")?.addEventListener("click", e => {
    const btn = e.target.closest("[data-fi]");
    if (!btn) return;
    selectedFlavorIdx = Number(btn.getAttribute("data-fi"));
    selectedVariantIdx = 0;
    refreshVariantSelector(p, lang);
    applyVariant(p, lang, isPages);
  });

  // Weight buttons — event delegation on the parent (survives innerHTML replacement)
  const weightWrap = document.getElementById("weight-btns");
  weightWrap?.addEventListener("click", e => {
    const btn = e.target.closest("[data-vi]");
    if (!btn || btn.classList.contains("out-of-stock")) return;
    selectedVariantIdx = Number(btn.getAttribute("data-vi"));
    refreshVariantSelector(p, lang);
    applyVariant(p, lang, isPages);
  });

  // Image arrows
  document.getElementById("img-prev")?.addEventListener("click", () => {
    if (!p.flavors.length) return;
    selectedFlavorIdx = (selectedFlavorIdx - 1 + p.flavors.length) % p.flavors.length;
    selectedVariantIdx = 0;
    refreshVariantSelector(p, lang);
    applyVariant(p, lang, isPages);
  });
  document.getElementById("img-next")?.addEventListener("click", () => {
    if (!p.flavors.length) return;
    selectedFlavorIdx = (selectedFlavorIdx + 1) % p.flavors.length;
    selectedVariantIdx = 0;
    refreshVariantSelector(p, lang);
    applyVariant(p, lang, isPages);
  });
}

function refreshVariantSelector(p, lang) {
  const flavorWrap = document.getElementById("flavor-btns");
  const weightWrap = document.getElementById("weight-btns");
  if (!flavorWrap || !weightWrap) return;

  // Update active state on flavor circles
  flavorWrap.querySelectorAll("[data-fi]").forEach(btn => {
    btn.classList.toggle("active", Number(btn.getAttribute("data-fi")) === selectedFlavorIdx);
  });

  // Rebuild weight buttons for the selected flavor only
  const flavor = p.flavors[selectedFlavorIdx];
  weightWrap.innerHTML = (flavor?.variants || []).map((v, vi) =>
    `<button class="variant-btn ${vi === selectedVariantIdx ? "active" : ""} ${v.in_stock ? "" : "out-of-stock"}" data-vi="${vi}">${v.weight}</button>`
  ).join("");
  // No individual listeners needed — #weight-btns delegation (set in wireVariantSelector) handles clicks
}

// ── apply selected variant → update price / image / stock ─────────────────────

function applyVariant(p, lang, isPages) {
  const v = currentVariant();
  if (!v) return;

  // Price
  document.getElementById("pd-price").innerHTML =
    `${v.price.toLocaleString()} <span>${Lang.t("da")}</span>`;
  const oldEl = document.getElementById("pd-old-price");
  if (v.old_price) {
    oldEl.textContent = v.old_price.toLocaleString();
    oldEl.style.display = "";
  } else {
    oldEl.style.display = "none";
  }

  // Image — only switch when user explicitly selects a flavor/weight
  const imgEl = document.getElementById("pd-img");
  if (imgEl) {
    const src = v.image ? resolvedImgSrc(v.image, isPages) : resolvedImgSrc(p.image, isPages);
    if (src) {
      imgEl.style.display = "";
      imgEl.src = src;
    }
  }

  // Stock
  updateStockLabel(v.in_stock, lang);

  // Disable add-to-cart if out of stock
  const cartBtn = document.getElementById("add-to-cart-btn");
  if (cartBtn) cartBtn.disabled = !v.in_stock;
}

function updateStockLabel(inStock, lang) {
  const el = document.getElementById("pd-stock-label");
  if (!el) return;
  if (inStock) {
    el.textContent = lang === "ar" ? "✓ متوفر في المخزن" : "✓ In Stock";
    el.style.color = "#38a169";
  } else {
    el.textContent = lang === "ar" ? "✗ نفد المخزون" : "✗ Out of Stock";
    el.style.color = "#e53e3e";
  }
}

// ── qty controls ──────────────────────────────────────────────────────────────

function wireQtyControls() {
  document.getElementById("qty-minus")?.addEventListener("click", () => {
    const inp = document.getElementById("qty-input");
    inp.value = Math.max(1, Number(inp.value) - 1);
  });
  document.getElementById("qty-plus")?.addEventListener("click", () => {
    const inp = document.getElementById("qty-input");
    inp.value = Number(inp.value) + 1;
  });
}

// ── cart & buy-now buttons ────────────────────────────────────────────────────

function wireCartButtons(p, lang, isPages) {
  const cartBtn   = document.getElementById("add-to-cart-btn");
  const buyNowBtn = document.getElementById("buy-now-btn");

  function doAddToCart() {
    const qty = Number(document.getElementById("qty-input").value) || 1;
    const v = currentVariant();
    if (v) {
      const flavor = p.flavors[selectedFlavorIdx];
      Cart.add(p.id, qty, {
        variant_id: v.id,
        flavor_en:  flavor.name.en,
        flavor_ar:  flavor.name.ar,
        weight:     v.weight
      });
    } else {
      Cart.add(p.id, qty);
    }
  }

  cartBtn?.addEventListener("click", () => {
    doAddToCart();
    const orig = cartBtn.textContent;
    cartBtn.textContent = lang === "ar" ? "✓ أُضيف" : "✓ Added";
    cartBtn.style.background = "var(--forge)";
    setTimeout(() => {
      cartBtn.textContent = Lang.t("add_to_cart");
      cartBtn.style.background = "";
    }, 1400);
  });

  buyNowBtn?.addEventListener("click", () => doAddToCart());
}

// ── init & lang change ────────────────────────────────────────────────────────

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get("slug");
  const root   = document.getElementById("pd-root");
  try {
    CURRENT_PRODUCT = await Api.getProduct(slug);
    selectedFlavorIdx  = 0;
    selectedVariantIdx = 0;
    renderProduct(CURRENT_PRODUCT, Lang.get());
  } catch {
    root.innerHTML = `<p style="text-align:center;padding:60px;color:var(--steel);">Product not found.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initProductPage);
document.addEventListener("langchange", e => {
  if (CURRENT_PRODUCT) renderProduct(CURRENT_PRODUCT, e.detail.lang);
});
