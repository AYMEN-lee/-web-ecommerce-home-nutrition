/* ============================================================
   api.js — single source of truth for data access.
   Right now it reads MOCK_PRODUCTS below.
   Later, swap the body of each function to call your Django
   REST endpoints (e.g. fetch(`${API_BASE}/products/`)) —
   nothing in the rest of the site needs to change.
   ============================================================ */

const API_BASE = "/api";
const USE_MOCK = false;

const MOCK_PRODUCTS = [
  {
    id: 1,
    slug: "ultra-whey",
    name: { ar: "ألترا واي بروتين", en: "Ultra Whey Protein Concentrate" },
    category: { ar: "بروتين", en: "Protein" },
    price: 7000,
    old_price: null,
    image: "images/products/ultra-whey.jpg",
    rating: 5,
    description: {
      ar: "بروتين مصل اللبن عالي الجودة، 24.4غ بروتين لكل حصة، يدعم نمو العضلات والاستشفاء بعد التمرين.",
      en: "High quality whey protein concentrate, 24.4g protein per serving, supports muscle growth and post-workout recovery."
    },
    in_stock: true
  },
  {
    id: 2,
    slug: "pure-whey",
    name: { ar: "بيور واي - غولدن بودي", en: "Pure Whey – Golden Body" },
    category: { ar: "بروتين", en: "Protein" },
    price: 7500,
    old_price: 8200,
    image: "images/products/pure-whey.jpg",
    rating: 4,
    description: {
      ar: "مزيج بروتين متعدد (WPC - WPI - WPH) لامتصاص سريع وبطيء، مثالي لجميع أوقات اليوم.",
      en: "Multi-protein complex (WPC - WPI - WPH) for fast and slow absorption, ideal for any time of day."
    },
    in_stock: true
  },
  {
    id: 3,
    slug: "iso-pro-whey",
    name: { ar: "ايزو برو واي", en: "ISO Pro Whey" },
    category: { ar: "بروتين", en: "Protein" },
    price: 8800,
    old_price: null,
    image: "images/products/iso-pro-whey.jpg",
    rating: 5,
    description: {
      ar: "بروتين معزول نقي بنسبة دهون ولاكتوز منخفضة جداً، مناسب لمن يبحث عن نتائج سريعة وجسم مشدود.",
      en: "Pure isolate protein with very low fat and lactose content, ideal for fast results and a lean physique."
    },
    in_stock: true
  },
  {
    id: 4,
    slug: "creatine-monohydrate",
    name: { ar: "كرياتين مونوهيدرات", en: "Creatine Monohydrate" },
    category: { ar: "كرياتين", en: "Creatine" },
    price: 4500,
    old_price: 5200,
    image: "images/products/creatine.jpg",
    rating: 5,
    description: {
      ar: "كرياتين نقي 100% لزيادة القوة والانفجارية العضلية خلال التمارين الثقيلة.",
      en: "100% pure creatine to boost strength and explosive power during heavy training."
    },
    in_stock: true
  },
  {
    id: 5,
    slug: "mass-gainer",
    name: { ar: "ماس غينر", en: "Mass Gainer" },
    category: { ar: "زيادة الوزن", en: "Weight Gain" },
    price: 9900,
    old_price: null,
    image: "images/products/mass-gainer.jpg",
    rating: 4,
    description: {
      ar: "مكمل غذائي عالي السعرات لزيادة الوزن والكتلة العضلية لمن يعانون من صعوبة في زيادة الوزن.",
      en: "High-calorie supplement for weight and muscle mass gain, ideal for hard gainers."
    },
    in_stock: true
  },
  {
    id: 6,
    slug: "fat-burner",
    name: { ar: "فات بيرنر", en: "Fat Burner" },
    category: { ar: "حارق دهون", en: "Fat Burner" },
    price: 5500,
    old_price: null,
    image: "images/products/fat-burner.jpg",
    rating: 4,
    description: {
      ar: "يساعد على رفع معدل الأيض وحرق الدهون الزائدة بشكل طبيعي وآمن.",
      en: "Helps boost metabolism and burn excess fat naturally and safely."
    },
    in_stock: true
  }
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

const Api = {
  async getProducts() {
    if (USE_MOCK) { await delay(150); return MOCK_PRODUCTS; }
    const res = await fetch(`${API_BASE}/products/`);
    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  },

  async getProduct(idOrSlug) {
    if (USE_MOCK) {
      await delay(100);
      const p = MOCK_PRODUCTS.find(p => p.slug === idOrSlug || p.id == idOrSlug);
      if (!p) throw new Error("Product not found");
      return p;
    }
    const res = await fetch(`${API_BASE}/products/${idOrSlug}/`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  },

  async submitOrder(orderData) {
    // orderData = { nom, prenom, adresse, email, telephone, items: [{product_id, qty}] }
    if (USE_MOCK) {
      await delay(400);
      console.log("MOCK ORDER SUBMITTED:", orderData);
      return { success: true, order_id: "MOCK-" + Date.now() };
    }
    const res = await fetch(`${API_BASE}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error("Order submission failed");
    return res.json();
  }
};
