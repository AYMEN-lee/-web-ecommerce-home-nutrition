const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const bcrypt = require("bcryptjs");

const db = new DatabaseSync(path.join(__dirname, "homenutrition.db"));

db.exec("PRAGMA journal_mode = WAL");

// ── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name_ar     TEXT    NOT NULL,
    name_en     TEXT    NOT NULL,
    category_ar TEXT    NOT NULL,
    category_en TEXT    NOT NULL,
    price       REAL    NOT NULL,
    old_price   REAL,
    image       TEXT    NOT NULL DEFAULT 'images/products/placeholder.jpg',
    rating      REAL    NOT NULL DEFAULT 5,
    desc_ar     TEXT    NOT NULL DEFAULT '',
    desc_en     TEXT    NOT NULL DEFAULT '',
    in_stock    INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref   TEXT    NOT NULL UNIQUE,
    prenom      TEXT    NOT NULL,
    nom         TEXT    NOT NULL,
    adresse     TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    telephone   TEXT    NOT NULL,
    total       REAL    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'pending',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty        INTEGER NOT NULL,
    unit_price REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin (
    id            INTEGER PRIMARY KEY,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL
  );
`);

// ── Seed: admin account ──────────────────────────────────────────────────────

const adminExists = db.prepare("SELECT id FROM admin WHERE username = ?").get("admin");
if (!adminExists) {
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO admin (username, password_hash) VALUES (?, ?)").run("admin", hash);
  console.log(`Admin account created. Username: admin  Password: ${password}`);
}

// ── Seed: products ───────────────────────────────────────────────────────────

const productCount = db.prepare("SELECT COUNT(*) as n FROM products").get().n;
if (productCount === 0) {
  const insert = db.prepare(`
    INSERT INTO products (slug, name_ar, name_en, category_ar, category_en, price, old_price, image, rating, desc_ar, desc_en, in_stock)
    VALUES (@slug, @name_ar, @name_en, @category_ar, @category_en, @price, @old_price, @image, @rating, @desc_ar, @desc_en, @in_stock)
  `);

  db.exec("BEGIN");
  try {
    [
      { slug: "ultra-whey", name_ar: "ألترا واي بروتين", name_en: "Ultra Whey Protein Concentrate", category_ar: "بروتين", category_en: "Protein", price: 7000, old_price: null, image: "images/products/ultra-whey.jpg", rating: 5, desc_ar: "بروتين مصل اللبن عالي الجودة، 24.4غ بروتين لكل حصة، يدعم نمو العضلات والاستشفاء بعد التمرين.", desc_en: "High quality whey protein concentrate, 24.4g protein per serving, supports muscle growth and post-workout recovery.", in_stock: 1 },
      { slug: "pure-whey", name_ar: "بيور واي - غولدن بودي", name_en: "Pure Whey – Golden Body", category_ar: "بروتين", category_en: "Protein", price: 7500, old_price: 8200, image: "images/products/pure-whey.jpg", rating: 4, desc_ar: "مزيج بروتين متعدد (WPC - WPI - WPH) لامتصاص سريع وبطيء، مثالي لجميع أوقات اليوم.", desc_en: "Multi-protein complex (WPC - WPI - WPH) for fast and slow absorption, ideal for any time of day.", in_stock: 1 },
      { slug: "iso-pro-whey", name_ar: "ايزو برو واي", name_en: "ISO Pro Whey", category_ar: "بروتين", category_en: "Protein", price: 8800, old_price: null, image: "images/products/iso-pro-whey.jpg", rating: 5, desc_ar: "بروتين معزول نقي بنسبة دهون ولاكتوز منخفضة جداً، مناسب لمن يبحث عن نتائج سريعة وجسم مشدود.", desc_en: "Pure isolate protein with very low fat and lactose content, ideal for fast results and a lean physique.", in_stock: 1 },
      { slug: "creatine-monohydrate", name_ar: "كرياتين مونوهيدرات", name_en: "Creatine Monohydrate", category_ar: "كرياتين", category_en: "Creatine", price: 4500, old_price: 5200, image: "images/products/creatine.jpg", rating: 5, desc_ar: "كرياتين نقي 100% لزيادة القوة والانفجارية العضلية خلال التمارين الثقيلة.", desc_en: "100% pure creatine to boost strength and explosive power during heavy training.", in_stock: 1 },
      { slug: "mass-gainer", name_ar: "ماس غينر", name_en: "Mass Gainer", category_ar: "زيادة الوزن", category_en: "Weight Gain", price: 9900, old_price: null, image: "images/products/mass-gainer.jpg", rating: 4, desc_ar: "مكمل غذائي عالي السعرات لزيادة الوزن والكتلة العضلية لمن يعانون من صعوبة في زيادة الوزن.", desc_en: "High-calorie supplement for weight and muscle mass gain, ideal for hard gainers.", in_stock: 1 },
      { slug: "fat-burner", name_ar: "فات بيرنر", name_en: "Fat Burner", category_ar: "حارق دهون", category_en: "Fat Burner", price: 5500, old_price: null, image: "images/products/fat-burner.jpg", rating: 4, desc_ar: "يساعد على رفع معدل الأيض وحرق الدهون الزائدة بشكل طبيعي وآمن.", desc_en: "Helps boost metabolism and burn excess fat naturally and safely.", in_stock: 1 }
    ].forEach(p => insert.run(p));
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// ── Helper: convert flat DB row → API shape ──────────────────────────────────

function rowToProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.name_ar, en: row.name_en },
    category: { ar: row.category_ar, en: row.category_en },
    price: row.price,
    old_price: row.old_price,
    image: row.image,
    rating: row.rating,
    description: { ar: row.desc_ar, en: row.desc_en },
    in_stock: row.in_stock === 1
  };
}

module.exports = { db, rowToProduct };
