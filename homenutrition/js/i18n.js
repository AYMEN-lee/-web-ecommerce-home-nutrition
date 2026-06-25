/* ============================================================
   i18n.js — bilingual AR / EN switching with RTL / LTR layout
   Usage in HTML: <span data-i18n="key">fallback text</span>
   ============================================================ */

const I18N = {
  ar: {
    search_placeholder: "ابحث عن منتج...",
    our_picks: "منتجاتنا المختارة",
    add_to_cart: "أضف إلى السلة",
    buy_now: "اشترِ الآن",
    add_to_wishlist: "أضف للمفضلة",
    description: "الوصف",
    cart: "السلة",
    my_account: "حسابي",
    shop: "المتجر",
    wishlist: "المفضلة",
    cart_title: "سلة المشتريات",
    cart_empty: "سلتك فارغة حالياً",
    continue_shopping: "متابعة التسوق",
    total: "المجموع",
    proceed_checkout: "إتمام الطلب",
    checkout_title: "إتمام الطلب",
    first_name: "الاسم",
    last_name: "اللقب",
    address: "العنوان",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    place_order: "تأكيد الطلب",
    order_summary: "ملخص الطلب",
    remove: "حذف",
    qty: "الكمية",
    da: "دج",
    home: "الرئيسية",
    order_success_title: "تم استلام طلبك!",
    order_success_text: "سنتصل بك قريباً لتأكيد التوصيل.",
    back_home: "العودة للرئيسية",
    required_field: "هذا الحقل مطلوب",
    invalid_email: "بريد إلكتروني غير صالح",
    invalid_phone: "رقم هاتف غير صالح",
    flavor: "النكهة",
    weight: "الوزن"
  },
  en: {
    search_placeholder: "Search for product...",
    our_picks: "Our Picks",
    add_to_cart: "Add To Cart",
    buy_now: "Buy Now",
    add_to_wishlist: "Add to wishlist",
    description: "Description",
    cart: "Cart",
    my_account: "My account",
    shop: "Shop",
    wishlist: "Wishlist",
    cart_title: "Shopping Cart",
    cart_empty: "Your cart is currently empty",
    continue_shopping: "Continue shopping",
    total: "Total",
    proceed_checkout: "Proceed to Checkout",
    checkout_title: "Place Order",
    first_name: "First name",
    last_name: "Last name",
    address: "Address",
    email: "Email",
    phone: "Phone number",
    place_order: "Place Order",
    order_summary: "Order Summary",
    remove: "Remove",
    qty: "Qty",
    da: "DZD",
    home: "Home",
    order_success_title: "Order received!",
    order_success_text: "We'll call you shortly to confirm delivery.",
    back_home: "Back to home",
    required_field: "This field is required",
    invalid_email: "Invalid email address",
    invalid_phone: "Invalid phone number",
    flavor: "Flavor",
    weight: "Weight"
  }
};

const Lang = {
  KEY: "hn_lang",

  get() {
    return localStorage.getItem(this.KEY) || "ar";
  },

  set(lang) {
    localStorage.setItem(this.KEY, lang);
    Lang.apply();
  },

  t(key) {
    return (I18N[Lang.get()] && I18N[Lang.get()][key]) || key;
  },

  apply() {
    const lang = Lang.get();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = Lang.t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", Lang.t(key));
    });
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    });

    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Lang.apply();
  document.querySelectorAll("[data-lang-btn]").forEach(btn => {
    btn.addEventListener("click", () => Lang.set(btn.getAttribute("data-lang-btn")));
  });
});
