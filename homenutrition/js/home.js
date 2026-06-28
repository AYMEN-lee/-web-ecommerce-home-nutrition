/* ============================================================
   home.js — live search + category cards + product grid
   ============================================================ */

const HERO = {
  ar: { title: "بروتين، كرياتين وكل ما يحتاجه جسمك", sub: "مكملات غذائية أصلية 100% بأفضل الأسعار في الجزائر، توصيل لجميع الولايات." },
  en: { title: "Whey, Creatine & Everything Your Body Needs", sub: "100% authentic supplements at the best prices in Algeria, delivery nationwide." }
};

const CATEGORY_ICONS = {
  all: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>`,
  Protein: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M8 3h8l1 5H7L8 3z"/>
    <path d="M7 8v2a5 5 0 0 0 10 0V8"/>
    <path d="M10 20v-5m4 5v-5"/><path d="M8 20h8"/>
  </svg>`,
  Creatine: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 3h6l2 4H7L9 3z"/>
    <path d="M5 7h14v2a7 7 0 0 1-14 0V7z"/>
    <path d="M12 17v4m-3 0h6"/>
  </svg>`,
  "Weight Gain": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="5" r="2.5"/>
    <path d="M3 10h18M5 10v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M9 14h6"/>
  </svg>`,
  "Fat Burner": `<svg viewBox="0 0 24 24" fill="none" stroke="${'#ff5a1f'}" stroke-width="2">
    <path d="M12 2c0 5-5 7-5 12a5 5 0 0 0 10 0C17 9 12 7 12 2z"/>
    <path d="M12 12c0 3-2 4-2 5.5a2 2 0 0 0 4 0C14 16 12 15 12 12z" fill="#ff5a1f" stroke="none"/>
  </svg>`,
};

const CAT_EN_MAP = {
  "بروتين": "Protein",
  "كرياتين": "Creatine",
  "زيادة الوزن": "Weight Gain",
  "حارق دهون": "Fat Burner",
};

function getCatIcon(catEn) {
  return CATEGORY_ICONS[catEn] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" stroke-linecap="round"/></svg>`;
}

function starsSvg(rating) {
  let h = "";
  for (let i = 0; i < 5; i++) {
    h += `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" fill="${i < rating ? '#f3b13a' : '#e4e3e0'}"/></svg>`;
  }
  return h;
}

function productCard(p, lang) {
  const name = p.name[lang];
  const cat  = p.category[lang];
  return `
  <article class="product-card">
    <a href="pages/product.html?slug=${p.slug}" class="product-thumb">
      ${p.old_price ? `<span class="badge-sale">-${Math.round((1 - p.price / p.old_price) * 100)}%</span>` : ""}
      <img src="${p.image}" alt="${name}" loading="lazy"
           onerror="this.src='https://placehold.co/400x400/0d0d0d/ffffff?text=${encodeURIComponent(name)}'">
    </a>
    <div class="product-info">
      <a href="pages/product.html?slug=${p.slug}">
        <div class="product-cat">${cat}</div>
        <div class="product-name">${name}</div>
      </a>
      <div class="product-rating">${starsSvg(p.rating)}</div>
      <div class="product-price-row">
        <span class="price">${p.price.toLocaleString()} <span data-i18n="da">DZD</span></span>
        ${p.old_price ? `<span class="price-old">${p.old_price.toLocaleString()}</span>` : ""}
      </div>
      <div class="product-actions">
        <button class="add-cart-btn" data-add="${p.id}">
          ${Lang.t("add_to_cart")}
        </button>
      </div>
    </div>
  </article>`;
}

let ALL_PRODUCTS = [];
let activeCategory = "all";
let searchQuery = "";

function productCatEn(p) { return p.category["en"]; }

function renderCategoryCards(lang) {
  const wrap = document.getElementById("category-grid");
  if (!wrap) return;
  const uniqueEn = ["all", ...new Set(ALL_PRODUCTS.map(productCatEn))];
  wrap.innerHTML = uniqueEn.map(catEn => {
    const isAll  = catEn === "all";
    const count  = isAll ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter(p => productCatEn(p) === catEn).length;
    const arLabel = isAll ? "الكل" : (Object.keys(CAT_EN_MAP).find(k => CAT_EN_MAP[k] === catEn) || catEn);
    const label  = lang === "ar" ? arLabel : (isAll ? "All" : catEn);
    const isActive = activeCategory === catEn;
    return `
      <button class="category-card ${isActive ? 'active' : ''}" data-caten="${catEn}">
        <div class="cat-label">${label}</div>
        <div class="cat-count">${count} ${lang === "ar" ? "منتج" : "items"}</div>
      </button>`;
  }).join("");

  wrap.querySelectorAll("[data-caten]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-caten");
      searchQuery = "";
      // Clear search input
      const si = document.querySelector(".search-bar input");
      if (si) si.value = "";
      renderCategoryCards(Lang.get());
      renderProducts(Lang.get());
      document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderProducts(lang) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  let filtered = activeCategory === "all"
    ? ALL_PRODUCTS
    : ALL_PRODUCTS.filter(p => productCatEn(p) === activeCategory);

  // Apply search query
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.name["ar"].toLowerCase().includes(q) ||
      p.name["en"].toLowerCase().includes(q) ||
      p.category["ar"].toLowerCase().includes(q) ||
      p.category["en"].toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    const msg = lang === "ar" ? "لا توجد منتجات مطابقة" : "No products found";
    grid.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>
        </svg>
        <p>${msg}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => productCard(p, lang)).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    const pid = Number(btn.getAttribute("data-add"));
    const product = ALL_PRODUCTS.find(p => p.id === pid);
    if (product?.has_variants) {
      // Variant products: navigate to product page to select flavor/weight
      btn.addEventListener("click", () => {
        window.location.href = `pages/product.html?slug=${product.slug}`;
      });
    } else {
      btn.addEventListener("click", () => {
        Cart.add(pid, 1);
        btn.textContent = lang === "ar" ? "✓ أُضيف" : "✓ Added";
        btn.style.background = "var(--forge)";
        setTimeout(() => {
          btn.textContent = Lang.t("add_to_cart");
          btn.style.background = "";
        }, 1400);
      });
    }
  });
}

function initSearch() {
  const input = document.querySelector(".search-bar input");
  if (!input) return;
  input.addEventListener("input", () => {
    searchQuery = input.value;
    // Reset category to all when searching
    if (searchQuery.trim()) activeCategory = "all";
    renderCategoryCards(Lang.get());
    renderProducts(Lang.get());
  });
  // Also handle form submit (enter key)
  const form = document.querySelector(".search-bar");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      searchQuery = input.value;
      renderProducts(Lang.get());
    });
  }
}

function applyHeroText(lang) {
  const h = document.querySelector("[data-i18n-hero]");
  const s = document.querySelector("[data-i18n-hero-sub]");
  if (h) h.textContent = HERO[lang].title;
  if (s) s.textContent = HERO[lang].sub;
}

async function init() {
  ALL_PRODUCTS = await Api.getProducts();
  const lang = Lang.get();
  applyHeroText(lang);
  renderCategoryCards(lang);
  renderProducts(lang);
  initSearch();
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("langchange", e => {
  applyHeroText(e.detail.lang);
  renderCategoryCards(e.detail.lang);
  renderProducts(e.detail.lang);
});
