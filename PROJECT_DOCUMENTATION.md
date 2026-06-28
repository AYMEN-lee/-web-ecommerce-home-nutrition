# Home Nutrition — Complete Project Documentation

> **Official technical reference for the Home Nutrition gym supplements e-commerce website.**
> Use this document to recreate, extend, or adapt the project for any similar store.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Technologies Used](#3-technologies-used)
4. [Database Structure](#4-database-structure)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Customer Website](#6-customer-website)
7. [Product System](#7-product-system)
8. [Flavor System](#8-flavor-system)
9. [Weight Variant System](#9-weight-variant-system)
10. [Inventory System](#10-inventory-system)
11. [Order System](#11-order-system)
12. [Shopping Cart](#12-shopping-cart)
13. [Checkout](#13-checkout)
14. [Image Upload System](#14-image-upload-system)
15. [API Routes](#15-api-routes)
16. [Frontend Logic](#16-frontend-logic)
17. [Backend Logic](#17-backend-logic)
18. [Arabic / English Localization](#18-arabic--english-localization)
19. [UI Design Principles](#19-ui-design-principles)
20. [Git Workflow](#20-git-workflow)
21. [How to Run the Project](#21-how-to-run-the-project)
22. [Future Improvements](#22-future-improvements)
23. [Architecture Decisions](#23-architecture-decisions)
24. [Developer Notes](#24-developer-notes)
25. [How to Reuse This Project](#25-how-to-reuse-this-project)

---

## 1. Project Overview

### Purpose

Home Nutrition is a bilingual (Arabic / English) e-commerce website for a gym supplements store based in Constantine, Algeria. It allows customers to browse, select, and order nutritional supplements online. Orders are collected and fulfilled manually — the store owner calls the customer to confirm before dispatching.

### Target Users

**Customers:** Algerian gym-goers and fitness enthusiasts who want to order protein, creatine, mass gainers, and fat burners online. Most customers are Arabic-speaking, so Arabic is the default language and RTL is the default layout direction.

**Admin (store owner):** A single trusted person who manages products, views incoming orders, confirms or cancels them, and tracks stock levels.

### Main Features

**For customers:**
- Bilingual interface — Arabic (RTL, default) and English (LTR)
- Homepage with hero banner, category filter cards, and product grid
- Live search across product names and categories in both languages
- Product detail page with flavor circles, weight selector, quantity control, stock indicator, description
- Shopping cart with full CRUD (add, remove, change quantity, persist across sessions)
- Checkout form with customer info (first name, last name, state/wilaya, municipality/commune, optional home delivery address, email, phone)
- Order confirmation screen after successful submission
- "Buy Now" shortcut that adds to cart and goes directly to the cart page

**For admin:**
- Secure login with JWT
- Full product CRUD (create, read, update, delete) with image upload
- Variant system: per-product flavors and per-flavor weight options, each with independent price, image, and stock
- Inventory tracking: optional stock quantity per variant (NULL = unlimited)
- Orders dashboard with status filter (All / Pending / Confirmed / Cancelled)
- Order actions: Confirm (reduces stock), Cancel (no stock change), Delete (only cancelled orders)
- Order details modal: customer info, delivery type, itemized list with flavor/weight/qty/subtotal
- Home delivery indicator per order
- Bulk delete of all cancelled orders

### Customer Workflow

```
1. Customer visits the website (default: Arabic, RTL)
2. Browses the homepage — sees category filters and product cards
3. Searches for a product by name or category
4. Clicks a product card → goes to the product detail page
5. Selects a flavor (colored circle) and a weight (button)
6. Sees the correct price, stock level, and remaining quantity
7. Adjusts quantity (cannot exceed available stock)
8. Clicks "Add To Cart" or "Buy Now"
   - "Add To Cart" → item added, stays on page
   - "Buy Now" → item added, navigated to cart page
9. Reviews cart: sees product name, flavor, weight, unit price, line total
10. Adjusts quantities or removes items
11. Clicks "Proceed to Checkout"
12. Fills in: First name, Last name, State (Wilaya), Municipality (Commune),
    Address (optional — for home delivery), Email, Phone
13. Clicks "Place Order" → order created with status "pending"
14. Sees a success screen with the order reference number
15. Waits for a phone call from the store to confirm
```

### Admin Workflow

```
1. Admin visits localhost:3000/admin/
2. Logs in with username + password → receives JWT (valid 8 hours)
3. Manages products:
   - Adds new products with all fields, image, variants
   - Edits existing products
   - Deletes products (removes all variants and clears order_items references)
4. Monitors orders:
   - Views all orders (newest first)
   - Filters by status: All / Pending / Confirmed / Cancelled
   - Sees customer name, phone, location, home delivery flag, items, total, status
   - Opens "Details" modal for full order breakdown
5. Calls the customer to confirm
6. Clicks "Confirm Order" → stock is reduced, status → "confirmed"
   OR
   Clicks "Cancel Order" → status → "cancelled", no stock change
7. Deletes cancelled orders individually or all at once
8. Monitors stock levels in the Products table
```

---

## 2. Folder Structure

```
gym7/
├── server.js                    # Express app entry point
├── db.js                        # Database initialization, schema, migrations, helpers
├── package.json                 # npm metadata and scripts
├── .env                         # Environment variables (JWT_SECRET, ADMIN_PASSWORD, PORT)
├── homenutrition.db             # SQLite database file (auto-created)
├── PROJECT_DOCUMENTATION.md     # This file
│
├── middleware/
│   └── auth.js                  # JWT verification middleware for admin routes
│
├── routes/
│   ├── products.js              # Public product API (GET list, GET single by slug/id)
│   ├── orders.js                # Public order API (POST create order)
│   └── admin.js                 # Protected admin API (products CRUD, orders management)
│
├── uploads/
│   └── products/                # Uploaded product images (served at /uploads/products/*)
│
└── homenutrition/               # Static frontend files served to the browser
    ├── index.html               # Homepage
    ├── cart.html                # Shopping cart page
    ├── checkout.html            # Checkout / place order page
    │
    ├── pages/
    │   └── product.html         # Product detail page (loaded with ?slug=xxx)
    │
    ├── images/
    │   ├── logo.png             # Store logo (used in header and hero)
    │   └── products/            # Static product images bundled with the frontend
    │
    ├── css/
    │   └── style.css            # All CSS for the customer-facing website
    │
    ├── js/
    │   ├── i18n.js              # Language system (AR/EN, RTL/LTR, key-value translations)
    │   ├── api.js               # Centralized fetch layer (getProducts, getProduct, submitOrder)
    │   ├── cart.js              # Cart state management (localStorage, add/remove/setQty/badge)
    │   ├── home.js              # Homepage: hero text, category cards, product grid, search
    │   ├── product.js           # Product detail page: variant selector, qty controls, add to cart
    │   ├── cart-page.js         # Cart page rendering and cart item controls
    │   └── checkout.js          # Checkout form rendering, validation, order submission
    │
    └── admin/
        └── index.html           # Complete admin dashboard (single-file SPA with embedded JS)
```

### File Responsibilities

**`server.js`** — Creates the Express app, applies middleware (CORS, JSON body parser), serves static files from `/homenutrition`, mounts the three route modules, and starts the HTTP server.

**`db.js`** — Opens the SQLite database, runs `PRAGMA journal_mode = WAL` for concurrent read safety, applies all schema migrations (ALTER TABLE statements wrapped in try/catch so they are idempotent), defines the full schema with `CREATE TABLE IF NOT EXISTS`, seeds the admin account and sample products on first run, and exports the three helper functions used by routes: `rowToProduct`, `getFlavors`, `saveFlavors`.

**`middleware/auth.js`** — Exports the `requireAdmin` middleware. Reads the `Authorization: Bearer <token>` header, verifies the JWT with the shared secret, attaches `req.admin` for downstream use, and sends 401 if missing or invalid.

**`routes/products.js`** — Two public GET routes. The list endpoint returns all in-stock products with their variant data. The single-product endpoint accepts slug or numeric ID.

**`routes/orders.js`** — One public POST route. Validates all fields, resolves each cart item to a database row (checking `in_stock` and `stock_qty`), calculates the server-authoritative total, and inserts the order and its items inside a transaction.

**`routes/admin.js`** — All protected routes: login (POST, no auth), change password, image upload, products CRUD, orders list, order confirm, order cancel, order delete (single and bulk).

**`homenutrition/js/i18n.js`** — The `Lang` object holds all translation strings for AR and EN, reads/writes the current language to `localStorage`, applies translations to `data-i18n` and `data-i18n-placeholder` elements, toggles `dir="rtl"/"ltr"` on `<html>`, and dispatches a `langchange` CustomEvent so other scripts can react.

**`homenutrition/js/api.js`** — The `Api` object abstracts all data fetching. Has `USE_MOCK` flag that can be toggled to use embedded mock data instead of the real API — useful for frontend-only development. All fetch calls go through here.

**`homenutrition/js/cart.js`** — The `Cart` object manages cart state in `localStorage` under the key `hn_cart`. Provides `add`, `remove`, `setQty`, `clear`, `count`, `get`, `save`, and `updateBadge`. Cart items are keyed by `(product_id, variant_id)` to allow multiple variants of the same product. Updates badge elements using `[data-cart-count]` selectors. Also listens to `pageshow` to fix stale badge counts when using browser back/forward cache.

**`homenutrition/js/home.js`** — Runs on the homepage. Fetches all products, renders the hero text, builds category filter cards, renders the product grid, and wires the live search. Category filtering and search filtering both happen client-side on the cached `ALL_PRODUCTS` array.

**`homenutrition/js/product.js`** — Runs on the product detail page. Fetches the product by slug from the URL query string, renders the full product UI (image, price, flavor circles, weight buttons, qty controls, stock label, description, Add To Cart / Buy Now buttons), wires all variant selection events, and enforces stock limits on the qty input.

**`homenutrition/js/cart-page.js`** — Runs on `cart.html`. Fetches all products to build a lookup index, purges cart items for deleted products, renders each cart item with variant details and correct variant price, wires quantity +/- and remove buttons with stock-aware caps.

**`homenutrition/js/checkout.js`** — Runs on `checkout.html`. Renders the form and order summary side by side. Validates all required fields, resolves variant prices for the summary display, submits the order to the API, and replaces the form with a success screen on completion.

**`homenutrition/admin/index.html`** — A self-contained single-page admin application. Contains all CSS, HTML structure, and JavaScript in one file. No external JS dependencies. Uses `fetch` directly with Bearer token authentication. Manages products and orders state in module-level variables.

---

## 3. Technologies Used

### Frontend

- **Pure HTML5** — No framework. Three customer HTML pages plus the admin SPA.
- **Vanilla JavaScript (ES2020+)** — Module-like structure with global objects (`Cart`, `Lang`, `Api`). No bundler, no transpilation.
- **CSS3** — Custom properties (variables), flexbox, grid, media queries. No CSS framework.
- **Google Fonts** — `Bebas Neue` (display headings), `Inter` (English body), `Tajawal` (Arabic body).
- **localStorage** — Used for: cart state (`hn_cart`), current language (`hn_lang`), admin JWT (`hn_admin_token`).

### Backend

- **Node.js v24** — Required. Uses the built-in `node:sqlite` module which is only available from Node.js v22.5+.
- **Express.js 4.x** — HTTP framework for routing, middleware, and static file serving.
- **cors** — Allows cross-origin requests (useful during development).
- **dotenv** — Loads `.env` file into `process.env`.
- **bcryptjs** — Hashes and verifies admin passwords.
- **jsonwebtoken** — Signs and verifies JWT tokens for admin authentication.
- **multer** — Handles `multipart/form-data` image uploads, stores files to disk.

### Database

- **SQLite** — Single-file embedded relational database (`homenutrition.db`).
- **`node:sqlite` (built-in)** — `DatabaseSync` class from Node.js core. Provides synchronous (blocking) SQL execution. Does NOT support `db.pragma()` or `db.transaction()` helpers — uses raw `db.exec("BEGIN/COMMIT/ROLLBACK")`.
- **WAL mode** — `PRAGMA journal_mode = WAL` enables concurrent reads while a write is in progress.
- **Foreign key constraints** — Enabled by default in `DatabaseSync` (`enableForeignKeyConstraints: true`).

### Authentication

- **JWT (JSON Web Token)** — Admin receives a signed token on login. Token expires after 8 hours. Stored in `localStorage` as `hn_admin_token`. Every protected admin API request sends `Authorization: Bearer <token>` header. The `requireAdmin` middleware verifies it server-side on every request.

### Server

- **nodemon** (dev dependency) — Auto-restarts the server when any `.js` file changes. Used with `npm run dev`.
- **node** — Production start with `npm start` (no auto-restart).

---

## 4. Database Structure

The database file is `homenutrition.db`, created automatically by Node.js when the server starts for the first time.

### Table: `products`

**Purpose:** Stores the master product record. For variant products, price/image/in_stock on this table serve as fallbacks only — the actual values come from `product_variants`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique numeric identifier |
| `slug` | TEXT | NOT NULL UNIQUE | URL-friendly identifier, e.g. `creatine-ostrovit-2` |
| `name_ar` | TEXT | NOT NULL | Product name in Arabic |
| `name_en` | TEXT | NOT NULL | Product name in English |
| `category_ar` | TEXT | NOT NULL | Category in Arabic, e.g. `كرياتين` |
| `category_en` | TEXT | NOT NULL | Category in English, e.g. `Creatine` |
| `price` | REAL | NOT NULL | Base price in DZD (overridden by variant price when variants exist) |
| `old_price` | REAL | NULL | Original price before discount. NULL means no discount |
| `image` | TEXT | NOT NULL DEFAULT `images/products/placeholder.jpg` | Path to the main product image. Can be a relative path or `/uploads/...` |
| `rating` | REAL | NOT NULL DEFAULT 5 | Star rating from 1 to 5 |
| `desc_ar` | TEXT | NOT NULL DEFAULT `''` | Product description in Arabic |
| `desc_en` | TEXT | NOT NULL DEFAULT `''` | Product description in English |
| `in_stock` | INTEGER | NOT NULL DEFAULT 1 | Boolean: 1 = in stock, 0 = out of stock. Derived from `stock_qty` when tracking |
| `stock_qty` | INTEGER | NULL | When NULL: unlimited stock (use `in_stock` toggle). When integer: tracked quantity |
| `created_at` | TEXT | NOT NULL DEFAULT `datetime('now')` | ISO 8601 timestamp of creation |

**Relationships:**
- Has many `product_flavors` (one per flavor/color option)
- Has many `product_variants` (through flavors)
- Referenced by `order_items.product_id`

---

### Table: `product_flavors`

**Purpose:** Represents a flavor option for a product. Each flavor groups one or more weight variants. Examples: "Natural", "Chocolate", "Strawberry".

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) ON DELETE CASCADE | Parent product |
| `name_ar` | TEXT | NOT NULL DEFAULT `''` | Flavor name in Arabic |
| `name_en` | TEXT | NOT NULL | Flavor name in English |
| `color` | TEXT | DEFAULT `'#cccccc'` | Hex color code for the flavor circle selector in the UI |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 | Display order among flavors |

**Relationships:**
- Belongs to one `products` row
- Has many `product_variants`

**Foreign keys:**
- `product_id → products(id)` with `ON DELETE CASCADE` (removing the product removes its flavors)

---

### Table: `product_variants`

**Purpose:** Represents a specific weight option within a flavor. This is the unit that the customer actually adds to the cart. Each variant has its own price, image, and stock.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID used as the cart's `variant_id` |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) ON DELETE CASCADE | Parent product (denormalized for easy joins) |
| `flavor_id` | INTEGER | NOT NULL REFERENCES product_flavors(id) ON DELETE CASCADE | Parent flavor |
| `weight` | TEXT | NOT NULL | Weight label displayed on the button, e.g. `300g`, `1kg`, `2lbs` |
| `price` | REAL | NOT NULL | Price of this specific variant in DZD |
| `old_price` | REAL | NULL | Original price before discount, or NULL |
| `image` | TEXT | NULL | Optional variant-specific image URL. If NULL, product's main image is used |
| `in_stock` | INTEGER | NOT NULL DEFAULT 1 | 1 = available, 0 = out of stock. Auto-derived from `stock_qty` when tracking |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 | Display order within the flavor |
| `stock_qty` | INTEGER | NULL | When NULL: unlimited. When integer: tracked quantity, `in_stock` derived from it |

**Relationships:**
- Belongs to one `product_flavors` row
- Belongs to one `products` row (denormalized)
- Referenced by `order_items.variant_id`

**Foreign keys:**
- `product_id → products(id)` with `ON DELETE CASCADE`
- `flavor_id → product_flavors(id)` with `ON DELETE CASCADE`

---

### Table: `orders`

**Purpose:** Stores each customer order as a single record with the customer's contact information, delivery details, total, and status.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal numeric ID |
| `order_ref` | TEXT | NOT NULL UNIQUE | Human-readable reference, format: `ORD-{timestamp}` e.g. `ORD-1782527663360` |
| `prenom` | TEXT | NOT NULL | Customer first name |
| `nom` | TEXT | NOT NULL | Customer last name |
| `adresse` | TEXT | NOT NULL | Home delivery address. Empty string `''` means no home delivery |
| `email` | TEXT | NOT NULL | Customer email address |
| `telephone` | TEXT | NOT NULL | Customer phone number (Algerian format: `0[5-7]XXXXXXXX`) |
| `wilaya` | TEXT | NOT NULL DEFAULT `''` | State / province (Wilaya) |
| `commune` | TEXT | NOT NULL DEFAULT `''` | Municipality (Commune / Baladiya) |
| `total` | REAL | NOT NULL | Server-calculated order total in DZD |
| `status` | TEXT | NOT NULL DEFAULT `'pending'` | `pending`, `confirmed`, or `cancelled` |
| `created_at` | TEXT | NOT NULL DEFAULT `datetime('now')` | ISO 8601 creation timestamp |

**Relationships:**
- Has many `order_items`

**Business logic encoded in status:**
- `pending` — order just placed, no stock change
- `confirmed` — admin confirmed, stock was decremented exactly once
- `cancelled` — admin cancelled, no stock change

---

### Table: `order_items`

**Purpose:** Each row is one line item in an order. Stores a snapshot of the price at the time of ordering and the variant details (flavor label, weight label) so the admin can see what was ordered even if the product is later edited.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID |
| `order_id` | INTEGER | NOT NULL REFERENCES orders(id) | Parent order |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) | The product ordered |
| `variant_id` | INTEGER | NULL | The specific variant ordered, or NULL for simple products |
| `flavor` | TEXT | NOT NULL DEFAULT `''` | Snapshot of the flavor name (English) at order time |
| `weight` | TEXT | NOT NULL DEFAULT `''` | Snapshot of the weight label at order time |
| `qty` | INTEGER | NOT NULL | Quantity ordered |
| `unit_price` | REAL | NOT NULL | Price at time of ordering (snapshot, not live) |

**Relationships:**
- Belongs to one `orders` row
- References one `products` row
- References one `product_variants` row (nullable)

**Foreign keys:**
- `order_id → orders(id)`
- `product_id → products(id)`

**Design note:** `flavor` and `weight` are text snapshots, not foreign keys. This means the admin can always read what was ordered even if the variant is later renamed or deleted.

---

### Table: `admin`

**Purpose:** Stores the single admin account. The application supports only one admin.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Always 1 |
| `username` | TEXT | NOT NULL UNIQUE | Admin login username (default: `admin`) |
| `password_hash` | TEXT | NOT NULL | bcrypt hash (cost factor 10) of the password |

**No relationships to other tables.**

---

### Migration Strategy

Migrations are applied at startup using `try/catch` blocks:

```javascript
try { db.exec("ALTER TABLE product_flavors ADD COLUMN color TEXT DEFAULT '#cccccc'"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN wilaya TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN commune TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN stock_qty INTEGER"); } catch {}
try { db.exec("ALTER TABLE product_variants ADD COLUMN stock_qty INTEGER"); } catch {}
try { db.exec("ALTER TABLE order_items ADD COLUMN variant_id INTEGER"); } catch {}
try { db.exec("ALTER TABLE order_items ADD COLUMN flavor TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE order_items ADD COLUMN weight TEXT NOT NULL DEFAULT ''"); } catch {}
```

The `catch {}` swallows the "duplicate column" error that SQLite throws if the migration has already been applied. This makes the block safe to run on every startup without tracking schema versions.

---

## 5. Admin Dashboard

The admin dashboard is a single-page application located at `http://localhost:3000/admin/`. It is a single HTML file (`homenutrition/admin/index.html`) containing all CSS, HTML, and JavaScript.

### Login

- **URL:** `http://localhost:3000/admin/`
- **Default credentials:** username `admin`, password `admin123` (change via the `.env` file: `ADMIN_PASSWORD=yourpassword` on first run)
- On page load, if `localStorage.hn_admin_token` exists, the app silently validates it against the products endpoint. If valid, the app screen is shown directly. If invalid or expired, the login screen is shown.
- On login: sends `POST /api/admin/login` with `{ username, password }`. Receives `{ token, username }`. Stores the token in localStorage and shows the app.
- **Token expiry:** 8 hours. After expiry, all admin API calls return 401 and the admin must log in again.
- **Logout:** Clears `hn_admin_token` from localStorage and shows the login screen.

### Statistics

Three stat cards at the top of the app (always visible):
- **Total Products** — count of all products in the database
- **In Stock** — products where `in_stock = 1`
- **Out of Stock** — products where `in_stock = 0`

Updated every time `loadProducts()` is called.

### Tabs

Two tabs: **Products** and **Orders**. Switching tabs only shows/hides the relevant `<div>`, data is loaded once on login for both.

---

### Products Tab

#### Product Table

Displays all products in a table with columns:
- **Image** — 48×48px thumbnail with error fallback SVG
- **Name (EN)** — English name plus Arabic name in grey below
- **Category** — English category name
- **Price (DZD)** — base product price
- **Old Price** — original price or "—"
- **Rating** — star glyphs (★★★★★)
- **Stock** — shows variant aggregate stock or product stock. For variant products: if any variant has `stock_qty` tracked, shows the sum total across all variants + "left". If no tracking, shows "Variants" or "Out". For simple products: shows quantity + "left" if tracked, or "In Stock" / "Out".
- **Actions** — Edit button and Delete button

#### Add Product

Button "+ Add Product" in the section header opens the product modal.

#### Product Modal

A scrollable modal with two sections:

**Basic Fields:**
| Field | Input | Notes |
|---|---|---|
| Name (Arabic) | text | Required |
| Name (English) | text | Required; auto-fills Slug field by converting to lowercase-hyphen |
| Slug (URL key) | text | Required, must be unique; auto-generated from English name when creating |
| Category (Arabic) | text | Required |
| Category (English) | text | Required |
| Price (DZD) | number | Required only when no variants are defined |
| Old Price | number | Optional; leave empty for no discount |
| Rating (1–5) | number | Step 0.5; default 5 |
| Description (Arabic) | textarea | Optional |
| Description (English) | textarea | Optional |
| In Stock | select | Yes / No; ignored when variants defined |
| Stock Quantity | number | Leave empty = unlimited; integer = tracked |
| Product Image | text + file button | See Image Upload section |

**Variants Section (Flavors & Weights):**

Below the basic fields, a collapsible-style section for adding flavors and weights.

- **+ Add Flavor** button adds a new flavor card
- Each **flavor card** has:
  - Arabic name input
  - English name input
  - Color swatch (`<input type="color">`) — chosen color appears as the circle in the customer UI
  - **✕ Remove** button deletes the entire flavor (and all its weights)
  - **Weights** list — each weight row has:
    - Weight label (e.g. `300g`)
    - Price (DZD)
    - Old Price (optional)
    - Stock Quantity (optional; empty = unlimited)
    - In Stock select (Yes/Out; auto-derived from Stock Qty when set)
    - Image URL field + "Choose" upload button
    - **✕** button removes the weight row
  - **+ Add Weight** button appends a new weight row

When saving, `syncVariantDataFromDOM()` reads all DOM inputs back into the `variantData` JavaScript array before sending to the API.

#### Edit Product

Click "Edit" on any product row to open the modal pre-filled with all existing data, including the full variant tree. The product image previews immediately. Saving sends a `PUT` to the API.

#### Delete Product

Click "Delete" → confirmation dialog. If confirmed, sends `DELETE /api/admin/products/:id`. The backend manually deletes child rows in FK-safe order: variants → flavors → order_items → product.

#### Image Upload

Two upload entry points in the modal:
1. **Product main image** — "Choose Image" button next to the image URL field
2. **Variant image** — "Choose" button in each weight row

Both upload to `POST /api/admin/upload-image` using `multipart/form-data`. On success, the URL is filled into the corresponding input field and a preview appears.

---

### Orders Tab

#### Filter Bar

Four buttons at the top: **All (N)**, **Pending (N)**, **Confirmed (N)**, **Cancelled (N)**.

Each button shows the live count of orders in that status. Clicking a button filters the table instantly (client-side, no re-fetch). The active filter button is styled with the orange primary color.

#### "Delete All Cancelled" Button

Appears in the section header only when there are cancelled orders. Clicking it shows a confirmation dialog with the exact count, then sends `DELETE /api/admin/orders/cancelled` which deletes all cancelled orders and their items.

#### Orders Table

Columns: **Ref / Date** | **Customer** | **Location** | **Items** | **Total (DZD)** | **Status** | **Actions**

**Ref / Date:** Monospaced order reference + creation timestamp (format: `YYYY-MM-DD HH:MM`).

**Customer:** Full name on one line, phone number below in grey.

**Location:** Wilaya — Commune on one line. Below it: "🏠 Home delivery: Yes" (green) or "📦 Home delivery: No" (grey), depending on whether the customer filled in the address field.

**Items:** Each item shown as one line: `Product Name ×qty — flavor · weight`. Compact mini-list.

**Total (DZD):** Bold server-calculated total.

**Status:** Color-coded badge:
- 🟡 **Pending** — yellow background, dark gold text
- 🟢 **Confirmed** — dark green background, green text
- 🔴 **Cancelled** — dark red background, red text

**Actions:**
- ✓ **Confirm** — green button; disabled when status is not `pending`. On click: confirmation dialog → `POST /api/admin/orders/:id/confirm` → stock decremented → status set to `confirmed`.
- ✕ **Cancel** — red button; disabled when already cancelled. On click: confirmation dialog → `POST /api/admin/orders/:id/cancel` → status set to `cancelled`.
- **Details** — ghost button, always enabled. Opens the order details modal.
- 🗑 **Delete** — red button; only visible on cancelled orders. On click: confirmation → `DELETE /api/admin/orders/:id` → order and its items permanently removed.

#### Order Details Modal

A larger modal (max 700px) showing:

**Customer section (left):**
- Full name (bold)
- Phone number
- Email address

**Delivery section (right):**
- Wilaya — Commune
- If address filled: green box labeled "🏠 Home Delivery" with the full address text
- If no address: "📦 Home Delivery: No — Office/Store Pickup"

**Ordered Items table:**
| Product | Flavor | Weight | Qty | Unit | Subtotal |
|---|---|---|---|---|---|
| Creatine OstroVit 2 | natural | 300g | 2 | 2 700 | 5 400 |

**Footer:** Total in DZD (orange accent), Status badge, Timestamp.

---

## 6. Customer Website

### Homepage (`index.html`)

**Top bar:** Thin bar at the very top containing "Shop" link and the language switcher (العربية | English). Language buttons have `data-lang-btn` attributes. The active language button has the `active` class.

**Header:** Contains:
- Logo (image + text "HOME NUTRITION / GYM SUPPLEMENTS")
- Search bar (full-width centered form)
- Cart icon with live badge showing item count

**Hero section:** Full-width dark banner with:
- Store logo image on the left/right (RTL flips layout)
- Eyebrow text "FUEL YOUR GAINS" (always English, decorative)
- Main heading (bilingual, switches language)
- Subtitle (bilingual, switches language)
- "Shop" button scrolling to the product section

**Category cards (`#category-grid`):** Horizontally scrollable row of category buttons. Dynamically generated from the unique categories in the products list. Always includes "All" as the first option. Each card shows the category name and item count. Clicking a card filters the product grid and scrolls to it.

**Product grid (`#product-grid`):** Responsive CSS grid of product cards. Each card has:
- Product image (clickable, links to product page)
- Discount badge (e.g. "-15%") when `old_price` is set
- Category label
- Product name
- Star rating (5 stars, filled/empty)
- Price (and old price crossed out if discounted)
- "Add To Cart" button
  - For variant products: navigates to the product page (must select flavor/weight first)
  - For simple products: adds directly to cart with qty 1

**Search:** Typing in the search bar filters the product grid in real time. Searches in both `name_ar`, `name_en`, `category_ar`, `category_en`. Resets category filter to "All" when search is active.

**Footer:** Store name, phone number (with explicit `dir="ltr"` so the number doesn't reverse in Arabic mode), location, and copyright.

**Mobile bottom navigation bar:** Fixed at the bottom on small screens. Contains Home and Cart links with icons and labels.

---

### Cart Page (`cart.html`)

**When cart is empty:** Shows an empty state with a cart icon SVG, "Your cart is currently empty" message, and "Continue shopping" button linking to the homepage.

**When cart has items:** Two-column layout:
- **Left (cart items):** Each item in a card showing:
  - Product thumbnail image
  - Product name
  - Variant label ("natural · 300g") in grey
  - Unit price
  - Qty control (−, number input, +) — capped at `stock_qty`
  - Line total (bold)
  - Remove button
- **Right (summary):** Total amount and "Proceed to Checkout" button

On load, the cart page purges any stale items referencing products that no longer exist in the database. This prevents "ghost" items in the cart.

The `+` button in the qty control silently stops incrementing when the quantity equals the variant's `stock_qty`. Manual input entry is clamped on the `change` event.

---

### Product Detail Page (`pages/product.html`)

Loaded with query string: `?slug=creatine-ostrovit-2`

**Left column:** Product image with optional left/right arrow navigation (shown only when the product has more than one flavor). The arrows change the displayed flavor image and update the variant selection.

**Right column:**
- Category breadcrumb
- Product name (H1)
- Star rating
- Price (updates when a variant is selected)
- Old price (struck-through, hidden if no discount)
- **Flavor selector:** Row of colored circles, one per flavor. Active flavor has a ring outline. Clicking a circle switches the flavor.
- **Weight selector:** Row of pill buttons, one per weight option for the selected flavor. Active weight has orange fill. Out-of-stock weights are visually muted and unclickable.
- **Quantity control:** Minus / number input / Plus. Max value enforced by the selected variant's `stock_qty`.
- **Stock label:** Shows "✓ In Stock" (green) or "✗ Out of Stock" (red). When tracked and ≤ 10 remaining, shows "✓ In Stock — N left".
- **Add To Cart** button (dark) — adds selected variant × qty to cart, shows "✓ Added" feedback for 1.4 seconds
- **Buy Now** button (orange) — same as Add To Cart but navigates to cart page
- **Description** heading + text (bilingual)

**State management:** Three module-level variables track current selection: `CURRENT_PRODUCT`, `selectedFlavorIdx`, `selectedVariantIdx`. They are reset on each page load.

---

### Checkout Page (`checkout.html`)

Two-column layout:
- **Left (form):** Customer information fields
- **Right (order summary):** Itemized list of cart items with variant details and correct variant prices, total

**Form fields:**
| Field | Required | Validation |
|---|---|---|
| First name | Yes | Non-empty |
| Last name | Yes | Non-empty |
| State (Wilaya) | Yes | Non-empty |
| Municipality (Commune) | Yes | Non-empty |
| Address | No | Optional — indicates home delivery |
| Email | Yes | Regex: `[^@]+@[^@]+\.[^@]+` |
| Phone | Yes | Regex: `^0[5-7][0-9]{8}$` |

On submit:
1. Client-side validation runs — invalid fields get an `has-error` class showing a red error message
2. If all valid, form data + cart items (with variant_id, flavor, weight) are sent to `POST /api/orders/`
3. Cart is cleared on success
4. Form is replaced with a success screen showing the order reference

The "Place Order" button is disabled during submission to prevent double-submit.

---

## 7. Product System

### Categories

Categories are free-text fields on the product (`category_ar`, `category_en`). There is no separate categories table. The homepage derives unique categories dynamically from the products array. The admin enters category names manually when creating or editing a product.

**Known categories in use:**
- Protein / بروتين
- Creatine / كرياتين
- Weight Gain / زيادة الوزن
- Fat Burner / حارق دهون

### Images

Products support two types of images:
1. **Static images** — relative paths like `images/products/creatine.jpg` that must be manually placed in the `homenutrition/images/products/` folder
2. **Uploaded images** — paths like `/uploads/products/product-1782527663360.jpg` uploaded through the admin panel and stored in `uploads/products/`

The `image` field on the product record stores the path. Variant images override the product image for a specific weight selection.

### Product Descriptions

Each product has two description fields: `desc_ar` (Arabic) and `desc_en` (English). They are free-form text displayed below the Add To Cart button on the product detail page.

### Slug

The `slug` is a URL-friendly unique identifier for the product. It is used in the URL query string to load the correct product: `?slug=creatine-ostrovit-2`. The admin panel auto-generates the slug from the English name by lowercasing and replacing spaces with hyphens. The admin can manually override it.

### Prices

Every product has a `price` (current) and optional `old_price`. When `old_price` is set and greater than `price`, the discount percentage badge is shown on product cards.

For variant products, the product-level price is overridden by the first variant's price for display in the product grid. On the detail page, the price always reflects the currently selected variant.

### Search

Search runs client-side on the in-memory `ALL_PRODUCTS` array. It matches against all four name/category fields simultaneously (case-insensitive). Results update on every keystroke without any API call.

---

## 8. Flavor System

### Purpose

Flavors group the weight options for a product. A product like "Creatine OstroVit 2" might come in "Natural", "Orange", and "Strawberry" flavors. Each flavor has its own set of weights (300g, 500g, 1000g) with independent prices.

### Color Selection

Each flavor has a `color` field storing a hex CSS color code (e.g. `#4db6e0` for light blue). In the admin, the admin clicks a color swatch (`<input type="color">`) to pick the color. This color is used as the background of the circular flavor selector button on the product page via the CSS custom property `--fc`:

```css
.flavor-circle {
  background: var(--fc, #cccccc);
}
```

### Default Flavor

When the product page loads, `selectedFlavorIdx = 0` and `selectedVariantIdx = 0`. The first flavor and its first weight are pre-selected visually and used for the initial stock label and Add To Cart functionality. The main product image is shown (not the variant image) until the user makes an explicit selection.

### Flavor Switching

Clicking a flavor circle:
1. Sets `selectedFlavorIdx` to the clicked flavor's index
2. Resets `selectedVariantIdx = 0`
3. Calls `refreshVariantSelector` — updates the active ring on flavor circles and rebuilds the weight buttons for the new flavor
4. Calls `applyVariant` — updates price, image, and stock label

The image arrows (prev/next) do the same thing but cycle through flavors in order.

### Image Changes

When a flavor is selected, if the currently selected weight variant has a `v.image`, that image is displayed. Otherwise, the product's main `p.image` is displayed. The image only changes when the user actively selects a flavor or weight — it does not auto-change on page load.

### Price Changes

Each weight variant within a flavor has its own `price` and `old_price`. Switching flavors resets to the first weight variant of the new flavor and updates the displayed price accordingly.

### Flavor Names

Stored as `name_ar` and `name_en` in `product_flavors`. Displayed in the UI based on the current language. Also stored as a text snapshot in `order_items.flavor` at order time (English name only, for admin display).

---

## 9. Weight Variant System

### Multiple Weights

Each flavor has one or more weight options. These are the `product_variants` rows associated with that flavor. Examples: 300g, 500g, 1000g, 1lb, 2kg.

### Weight Buttons

Rendered as pill-shaped `<button>` elements in a row labeled "WEIGHT". Each shows the weight text (e.g. "300g"). The active weight has an orange background. Out-of-stock weights are visually muted and have an `out-of-stock` class that makes them non-interactive.

### Variant Prices

Each `product_variants` row has its own `price` and `old_price`. Selecting a different weight updates the displayed price and old price in the UI. The price shown on the product page and in the cart/checkout always reflects the selected variant's price, not the product's base price.

### Variant Stock

Each `product_variants` row has its own `stock_qty` (integer or NULL) and `in_stock` (boolean). The stock label on the product page shows the currently selected variant's stock status. Selecting a different weight re-runs `applyVariant` which calls `updateStockLabel` with the new variant's `in_stock` and `stock_qty`.

### Relationship Between Flavor and Weight

Weights belong to flavors. You cannot have a weight without a parent flavor. When the admin defines variants, they create flavor cards and add weight rows inside each flavor card. In the database, `product_variants` references `product_flavors` via `flavor_id`.

When a customer switches flavor, the weight buttons are rebuilt from scratch to show only that flavor's weights. The weight selected before switching does not carry over.

### How Selected Variant Changes Price

```javascript
function applyVariant(p, lang, isPages) {
  const v = currentVariant(); // p.flavors[selectedFlavorIdx].variants[selectedVariantIdx]
  document.getElementById("pd-price").innerHTML =
    `${v.price.toLocaleString()} <span>${Lang.t("da")}</span>`;
  // old price: shown/hidden based on v.old_price
}
```

### How Selected Variant Changes Stock

```javascript
function applyVariant(p, lang, isPages) {
  const v = currentVariant();
  updateStockLabel(v.in_stock, lang, v.stock_qty);
  setQtyMax(v.stock_qty); // sets max attribute on qty input
  const cartBtn = document.getElementById("add-to-cart-btn");
  if (cartBtn) cartBtn.disabled = !v.in_stock;
}
```

---

## 10. Inventory System

### Stock Modes

The system supports two stock modes per product/variant:

**Unlimited mode (default):** `stock_qty = NULL`. The admin toggles `in_stock` (Yes/No) manually. No quantity tracking. Used for products where the admin re-stocks frequently and doesn't want per-unit tracking.

**Tracked mode:** `stock_qty = integer ≥ 0`. The `in_stock` boolean is automatically derived: `in_stock = (stock_qty > 0)`. When `stock_qty` reaches 0, `in_stock` is set to 0 automatically. Used when the admin wants precise per-unit inventory.

### Stock Per Variant

Stock is tracked individually per `product_variants` row. A product with 3 flavors × 3 weights has 9 independent stock counters. The admin enters the stock quantity in the weight row inside the variant section of the product modal.

### Available Quantity Display

On the product page, when a tracked variant with ≤ 10 units remaining is selected, the stock label shows:

```
✓ In Stock — 3 left
```

This uses the `stockQty` parameter in `updateStockLabel`:

```javascript
const qtyNote = (stockQty !== null && stockQty <= 10)
  ? ` — ${stockQty} ${lang === "ar" ? "متبقية" : "left"}`
  : "";
```

### Out of Stock Behavior

- Weight button gets `out-of-stock` class → muted appearance, click event is blocked
- If the first variant is out of stock on page load, "Add To Cart" button is disabled
- The stock label shows "✗ Out of Stock" in red

### Customer Quantity Limits

Three layers enforce the limit:

1. **Qty input max attribute** (`setQtyMax`) — HTML `max` attribute set on the number input
2. **`+` button cap** — reads `inp.max` and clamps: `Math.min(max, current + 1)`
3. **`change` event clamp** — on manual input, clamps to `[1, max]`
4. **`doAddToCart` cap** — calculates `stockLimit - alreadyInCart` before adding, returns early if result ≤ 0
5. **Cart page cap** — `+` button checks `itemStockQty(item, product)` before incrementing
6. **Server validation** — `POST /api/orders/` checks `stock_qty < qty` and returns HTTP 400

### Stock Reduction Timing

Stock is **NOT reduced when the order is placed**. It is **only reduced when the admin confirms the order**. This is idempotent — confirming an already-confirmed order is rejected (`status !== 'pending'` check).

---

## 11. Order System

### Complete Order Lifecycle

```
Customer places order
        │
        ▼
  [order inserted]
  status = "pending"
  stock unchanged
        │
        ▼
  Admin views order in dashboard
  Calls customer by phone
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Confirm    Cancel
   │         │
   ▼         ▼
status =  status =
"confirmed" "cancelled"
stock       stock
decremented unchanged
```

### What Happens to Stock at Each Step

**Order placed (`POST /api/orders/`):**
- Validates `in_stock = true` (boolean check)
- Validates `qty ≤ stock_qty` (quantity check, when `stock_qty` is tracked)
- Does NOT modify `stock_qty` or `in_stock`
- Inserts the order with `status = 'pending'`

**Admin confirms (`POST /api/admin/orders/:id/confirm`):**
- Checks `order.status === 'pending'` — if not pending, returns 400 (idempotency guard)
- Fetches all `order_items` for this order
- For each item with a tracked variant (`variant.stock_qty !== null`):
  - Checks `variant.stock_qty >= item.qty`, returns 400 if insufficient
  - Decrements: `stock_qty -= item.qty`
  - Updates `in_stock` automatically from new `stock_qty`
- For each simple product item with tracked stock: same logic on `products.stock_qty`
- Sets `status = 'confirmed'`
- All wrapped in a transaction — fully atomic

**Admin cancels (`POST /api/admin/orders/:id/cancel`):**
- Checks order is not already cancelled
- Sets `status = 'cancelled'`
- Does NOT touch any stock values

### Why Stock is Reduced Only After Confirmation

The design reflects the real business workflow: the store calls the customer to verify the order before preparing the shipment. Orders placed by mistake, test orders, or unreachable customers are cancelled. Reducing stock immediately on order placement would:
- Create phantom reservations for orders that never ship
- Prevent legitimate customers from ordering the last units
- Require a "restock on cancel" reversal mechanism

By waiting for admin confirmation, stock numbers always reflect actual committed fulfillment.

---

## 12. Shopping Cart

### Cart Storage

The cart is stored in `localStorage` under the key `hn_cart` as a JSON array.

### Cart Item Shape

```javascript
{
  product_id: 42,           // Integer — product's database ID
  variant_id: 7,            // Integer or null — variant's database ID
  flavor_en: "Natural",     // String — English flavor name for display
  flavor_ar: "طبيعي",      // String — Arabic flavor name for display
  weight: "300g",           // String — weight label for display
  qty: 2                    // Integer ≥ 1
}
```

### Cart Key / Merging Logic

Items are identified by the composite key `(product_id, variant_id)`. The `Cart.add()` method:

```javascript
const existing = items.find(i =>
  i.product_id === productId && (i.variant_id ?? null) === variantId
);
if (existing) {
  existing.qty += qty;
} else {
  items.push({ ... });
}
```

This means:
- Adding the same variant twice increments its qty rather than creating a duplicate entry
- Adding two different variants of the same product creates two separate entries
- The `doAddToCart` function in `product.js` caps the added qty against what's already in the cart before calling `Cart.add`, preventing the total from exceeding `stock_qty`

### Badge Count

The cart badge (`data-cart-count`) is updated on every `Cart.save()` call and also on the `pageshow` event (to handle browser back navigation from bfcache where `DOMContentLoaded` does not re-fire).

### Persistence

Cart persists across page navigation, browser close, and browser restart because `localStorage` is permanent. The cart is only cleared explicitly on:
- Successful order submission (`Cart.clear()`)
- Manual item removal by the customer

### Price Calculation

The cart does not store prices. Prices are always resolved live:
- In `cart-page.js`, `itemPrice(item, p)` looks up `p.flavors` to find the matching variant by `variant_id` and returns its `price`
- In `checkout.js`, `resolveVariantPrice(item, p)` does the same
- The server re-calculates the total independently from the database — the client total is for display only

### Stale Item Purging

When `initCartPage()` runs (on every cart page load), it:
1. Fetches all current products
2. Builds a `Set` of valid product IDs
3. Filters the cart to remove any items whose `product_id` is not in the set
4. Saves the cleaned cart if any items were removed

This handles the case where an admin deletes a product that a customer had in their cart.

---

## 13. Checkout

### Form Structure

The checkout form renders with `formHtml(lang)` inside `checkout.js`. All labels use `Lang.t("key")` directly (not `data-i18n` attributes) because the HTML is injected after `DOMContentLoaded` fires, so `Lang.apply()` would not reach it.

### Validation

Client-side validation in `validateForm()`:

```javascript
setError("g-prenom",  !prenom);   // required
setError("g-nom",     !nom);      // required
setError("g-wilaya",  !wilaya);   // required
setError("g-commune", !commune);  // required
// address: not validated (optional)
setError("g-email",   !emailOk);  // regex
setError("g-phone",   !phoneOk);  // Algerian phone regex: ^0[5-7][0-9]{8}$
```

Each group ID (`g-prenom`, etc.) maps to a `<div class="form-group">` element. Setting class `has-error` makes the `.error-msg` child visible via CSS.

Phone validation uses the Algerian mobile phone format:
- Must start with `05`, `06`, or `07`
- Followed by exactly 8 more digits
- Spaces are stripped before validation

### Order Submission

```javascript
const items = Cart.get().map(i => ({
  product_id: i.product_id,
  variant_id: i.variant_id || null,
  flavor:     i.flavor_en  || "",
  weight:     i.weight     || "",
  qty:        i.qty
}));
const result = await Api.submitOrder({ ...data, items });
```

The API call goes to `POST /api/orders/`. The server validates all fields again (server-side validation mirrors client-side), resolves prices from the database (ignoring any client-sent prices), and calculates the authoritative total.

### Pending Orders

Every successfully submitted order has `status = 'pending'`. The customer sees a success screen immediately. The order reference (e.g. `ORD-1782527663360`) is shown so the customer can reference it when the store calls.

---

## 14. Image Upload System

### Upload Flow

1. Admin clicks "Choose Image" button in the product modal
2. A hidden `<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp">` is triggered
3. On `change`, `uploadImage(input)` runs:
   - Creates an object URL for instant local preview (before upload completes)
   - Sets status to "Uploading..."
   - Sends `FormData` with the file to `POST /api/admin/upload-image`
   - On success: fills the image URL text field with the returned path, updates the preview `src`
   - On failure: shows error message in red

### Storage

Uploaded files are stored in `uploads/products/` inside the project root. The directory is created automatically on server startup if it doesn't exist. Files are never deleted automatically — old images remain on disk even after the product is updated with a new image.

### Generated File Names

Multer generates file names in the format: `product-{timestamp}{extension}`. Example: `product-1782527663360.jpg`. This guarantees uniqueness (within the same millisecond).

### Served URL

Uploaded images are served by Express at `/uploads/products/filename.jpg`. The `server.js` line:

```javascript
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

### Variant Images

Each weight row in the admin product modal has its own image field. Clicking "Choose" triggers a hidden file input specific to that `(flavorIndex, variantIndex)` pair. The uploaded URL is saved to `variantData[fi].variants[vi].image`. When a customer selects a variant with its own image, that image is shown instead of the product's main image.

### Image Validation (Server-Side)

Multer's `fileFilter` checks `file.mimetype` against `image/(jpeg|png|webp|gif)`. Files exceeding 5MB are rejected (`limits: { fileSize: 5 * 1024 * 1024 }`).

---

## 15. API Routes

All routes are prefixed by `/api`. Admin routes require `Authorization: Bearer <token>`.

---

### Public Routes

#### `GET /api/products/`

**Purpose:** Returns the full list of all products with their variants. Used by the homepage, cart page, and checkout page.

**Response:**
```json
[
  {
    "id": 1,
    "slug": "creatine-ostrovit-2",
    "name": { "ar": "كرياتين أوستروفيت 2", "en": "Creatine OstroVit 2" },
    "category": { "ar": "كرياتين", "en": "Creatine" },
    "price": 2700,
    "old_price": null,
    "image": "/uploads/products/product-1782.jpg",
    "rating": 5,
    "description": { "ar": "...", "en": "..." },
    "in_stock": true,
    "stock_qty": null,
    "has_variants": true,
    "flavors": [
      {
        "id": 1,
        "name": { "ar": "طبيعي", "en": "Natural" },
        "color": "#4db6e0",
        "variants": [
          { "id": 1, "weight": "300g", "price": 2700, "old_price": null, "image": null, "in_stock": true, "stock_qty": 5 },
          { "id": 2, "weight": "1000g", "price": 5000, "old_price": null, "image": null, "in_stock": true, "stock_qty": 3 }
        ]
      }
    ]
  }
]
```

For variant products, the top-level `price`, `old_price`, `image`, and `in_stock` are overridden by the first variant's values (`applyVariantDefaults`).

**Database changes:** None (read-only).

---

#### `GET /api/products/:slug`

**Purpose:** Returns a single product by slug (or numeric ID). Used by the product detail page.

**Parameters:** `:slug` — URL slug or numeric ID.

**Response:** Same shape as one item from the list endpoint.

**Database changes:** None.

---

#### `POST /api/orders/`

**Purpose:** Creates a new order with status `pending`.

**Request body:**
```json
{
  "prenom": "Ahmed",
  "nom": "Bettayeb",
  "wilaya": "Buira",
  "commune": "Lakhdaria",
  "adresse": "Rue des Sports, Apt 3",
  "email": "ahmed@example.com",
  "telephone": "0666666666",
  "items": [
    { "product_id": 1, "variant_id": 2, "flavor": "Natural", "weight": "300g", "qty": 2 },
    { "product_id": 1, "variant_id": 5, "flavor": "Natural", "weight": "1000g", "qty": 1 }
  ]
}
```

**Validation:**
- All required fields present
- Phone matches `^0[5-7][0-9]{8}$`
- Each item: `qty ≥ 1`
- For variant items: variant exists, `in_stock = true`, `qty ≤ stock_qty` (when tracked)
- For simple items: product exists, `in_stock = true`, `qty ≤ stock_qty` (when tracked)

**Response:**
```json
{ "success": true, "order_id": "ORD-1782527663360" }
```

**Database changes:**
- INSERT into `orders`
- INSERT N rows into `order_items`
- No stock changes

---

### Admin Routes (all require JWT)

#### `POST /api/admin/login`

**Purpose:** Authenticates the admin and returns a JWT.

**Request body:** `{ "username": "admin", "password": "admin123" }`

**Response:** `{ "token": "eyJ...", "username": "admin" }`

**Database changes:** None (read-only).

---

#### `POST /api/admin/change-password`

**Purpose:** Changes the admin password.

**Request body:** `{ "current_password": "...", "new_password": "..." }`

**Validation:** New password must be ≥ 6 characters. Current password must match bcrypt hash.

**Database changes:** UPDATE admin SET password_hash.

---

#### `GET /api/admin/products`

**Purpose:** Returns all products including out-of-stock ones (unlike the public endpoint which returns all but marks them as out of stock).

**Response:** Same shape as public products endpoint.

---

#### `POST /api/admin/products`

**Purpose:** Creates a new product.

**Request body:** All product fields + `flavors` array.

**Validation:** slug, name_ar, name_en, category_ar, category_en required. Price required when no variants.

**Database changes:** INSERT into products; if flavors provided, DELETE + INSERT into product_flavors and product_variants (via `saveFlavors`).

---

#### `PUT /api/admin/products/:id`

**Purpose:** Updates an existing product and replaces all variants.

**Request body:** Same as POST.

**Database changes:** UPDATE products; DELETE + INSERT product_flavors and product_variants.

---

#### `DELETE /api/admin/products/:id`

**Purpose:** Permanently deletes a product.

**Database changes (FK-safe order):**
1. DELETE FROM product_variants WHERE product_id = ?
2. DELETE FROM product_flavors WHERE product_id = ?
3. DELETE FROM order_items WHERE product_id = ?
4. DELETE FROM products WHERE id = ?

---

#### `POST /api/admin/upload-image`

**Purpose:** Uploads an image file and returns its URL.

**Request:** `multipart/form-data` with field `image`.

**Response:** `{ "image": "/uploads/products/product-1782527663360.jpg" }`

**Database changes:** None (file only).

---

#### `POST /api/admin/products/:id/image`

**Purpose:** Attaches an image to an existing product (updates the `image` column).

**Database changes:** UPDATE products SET image.

---

#### `GET /api/admin/orders`

**Purpose:** Returns all orders with their items (including variant flavor/weight).

**Response:**
```json
[
  {
    "id": 1,
    "order_ref": "ORD-1782527663360",
    "prenom": "Ahmed",
    "nom": "Bettayeb",
    "telephone": "0666666666",
    "email": "ahmed@example.com",
    "wilaya": "Buira",
    "commune": "Lakhdaria",
    "adresse": "Rue des Sports, Apt 3",
    "total": 10400,
    "status": "pending",
    "created_at": "2026-06-27T02:34:00",
    "items": [
      {
        "qty": 2,
        "unit_price": 2700,
        "variant_id": 2,
        "flavor": "Natural",
        "weight": "300g",
        "name_ar": "كرياتين أوستروفيت 2",
        "name_en": "Creatine OstroVit 2",
        "slug": "creatine-ostrovit-2"
      }
    ]
  }
]
```

---

#### `POST /api/admin/orders/:id/confirm`

**Purpose:** Confirms a pending order and decrements stock.

**Validation:**
- Order must exist
- `order.status` must be `'pending'` (idempotency guard)
- Each variant item: `stock_qty >= qty` (when tracked)

**Database changes (in transaction):**
- For tracked variants: UPDATE product_variants SET stock_qty, in_stock
- For tracked simple products: UPDATE products SET stock_qty, in_stock
- UPDATE orders SET status = 'confirmed'

**Response:** `{ "success": true }`

---

#### `POST /api/admin/orders/:id/cancel`

**Purpose:** Cancels an order (any status except already cancelled).

**Database changes:** UPDATE orders SET status = 'cancelled'

**Response:** `{ "success": true }`

---

#### `DELETE /api/admin/orders/:id`

**Purpose:** Permanently deletes a single cancelled order.

**Validation:** Order must be `status = 'cancelled'`.

**Database changes:**
1. DELETE FROM order_items WHERE order_id = ?
2. DELETE FROM orders WHERE id = ?

---

#### `DELETE /api/admin/orders/cancelled`

**Purpose:** Bulk deletes all cancelled orders.

**Important:** This route must be defined BEFORE `DELETE /orders/:id` in the router so Express doesn't match "cancelled" as an `:id` parameter.

**Database changes:**
1. SELECT all cancelled order IDs
2. For each: DELETE FROM order_items
3. DELETE FROM orders WHERE status = 'cancelled'

**Response:** `{ "success": true, "deleted": 5 }`

---

## 16. Frontend Logic

### Architecture Overview

The frontend is **vanilla JavaScript with no framework, no bundler, no transpilation**. Each page loads the scripts it needs as `<script>` tags in the right order. Global objects (`Lang`, `Cart`, `Api`) are shared across all scripts on a page.

### Script Load Order (homepage example)

```html
<script src="js/i18n.js"></script>   <!-- 1. Lang object + translations -->
<script src="js/cart.js"></script>   <!-- 2. Cart object + badge update -->
<script src="js/api.js"></script>    <!-- 3. Api object -->
<script src="js/home.js"></script>   <!-- 4. Page-specific logic -->
```

### State Management

Global module-level variables per page:

**home.js:**
- `ALL_PRODUCTS` — full product list cached from the API
- `activeCategory` — currently selected category filter (default: `"all"`)
- `searchQuery` — current search string

**product.js:**
- `CURRENT_PRODUCT` — the product data object fetched from API
- `selectedFlavorIdx` — index into `CURRENT_PRODUCT.flavors`
- `selectedVariantIdx` — index into the selected flavor's `variants` array

**cart-page.js:**
- `PRODUCTS_INDEX` — `{ [product_id]: product }` lookup map

**checkout.js:**
- `CHECKOUT_PRODUCTS` — same as `PRODUCTS_INDEX`

**admin/index.html:**
- `allProducts` — full product list for admin (includes out-of-stock)
- `allOrders` — full order list
- `variantData` — current flavor/variant data for the open product modal
- `currentProductId` — ID of product being edited (null for new)
- `orderFilter` — current status filter: `"all"`, `"pending"`, `"confirmed"`, `"cancelled"`
- `token` — JWT from localStorage

### Data Fetching

All API calls go through `Api` (customer) or `fetch` with Bearer header (admin). Both use `async/await`. Errors are caught and displayed to the user.

### Rendering Strategy

The site uses **string interpolation rendering** — template literals that return HTML strings, assigned to `element.innerHTML`. This is simple, fast, and avoids virtual DOM overhead. Event listeners are re-attached after every re-render using element query selectors.

### Event Delegation

For the variant selector on the product page, event delegation is used on the parent containers (`#flavor-btns`, `#weight-btns`) rather than individual button listeners. This is necessary because `refreshVariantSelector` rebuilds the weight buttons' innerHTML, which would destroy individually-attached listeners.

### Language Change Events

When the language changes:
1. `Lang.set(lang)` is called
2. `Lang.apply()` runs — updates DOM elements, toggles RTL
3. A `langchange` CustomEvent is dispatched with `detail: { lang }`
4. Each page script listens for this event and re-renders its content:
   ```javascript
   document.addEventListener("langchange", e => renderProducts(e.detail.lang));
   ```

### BFCache Handling

The `pageshow` event fires when a page is restored from the browser's back/forward cache (bfcache). `DOMContentLoaded` does NOT fire in this case. The cart badge is updated on `pageshow` to prevent showing a stale count after navigating back.

---

## 17. Backend Logic

### Express App Setup (`server.js`)

```javascript
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static("homenutrition"));     // serves all frontend files
app.use("/api/products", require("./routes/products"));
app.use("/api/orders",   require("./routes/orders"));
app.use("/api/admin",    require("./routes/admin"));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "homenutrition", "index.html")));
```

The catch-all GET route ensures deep-linking (e.g. `/pages/product.html`) works correctly by serving the frontend's HTML files directly from the static middleware before the catch-all is reached.

### Database Access Pattern

All SQL is written using `node:sqlite`'s `db.prepare(sql).get(params)` / `.all(params)` / `.run(params)` pattern. There are no ORMs, no query builders. Queries are hand-written SQL.

The `DatabaseSync` connection is module-level singleton in `db.js`, shared across all routes via `require("../db")`.

### Transaction Pattern

Because `DatabaseSync` does not support `db.transaction()`, explicit transaction control is used:

```javascript
db.exec("BEGIN");
try {
  // ... multiple statements ...
  db.exec("COMMIT");
} catch (e) {
  db.exec("ROLLBACK");
  throw e; // or return error response
}
```

This pattern is used in: order creation, product save (with variants), product delete, order confirm, order delete.

### `saveFlavors` Logic

When saving a product with variants:
1. DELETE all existing `product_flavors` for this product (cascades to `product_variants` via FK)
2. For each flavor in the submitted array: INSERT into `product_flavors`
3. For each variant in the flavor: INSERT into `product_variants`

The `in_stock` for each variant is derived:
```javascript
const sqty = parseInt(v.stock_qty) if provided else null;
const inStock = sqty !== null ? (sqty > 0 ? 1 : 0) : (v.in_stock ? 1 : 0);
```

### `applyVariantDefaults` Logic

When returning a variant product from the public API, the top-level `price`, `image`, and `in_stock` are overridden by the first variant's values. This ensures the product card on the homepage shows a meaningful price (first variant's price) and availability:

```javascript
function applyVariantDefaults(product, flavors) {
  const allVariants = flavors.flatMap(f => f.variants);
  const first = allVariants[0];
  return {
    ...product,
    price: first.price,
    old_price: first.old_price,
    image: first.image || product.image,
    in_stock: allVariants.some(v => v.in_stock),
  };
}
```

### Error Handling

Routes return JSON error objects with appropriate HTTP status codes:
- 400 — validation failure, business rule violation
- 401 — missing or invalid token
- 404 — resource not found
- 409 — unique constraint (slug already exists)
- 500 — unexpected server error

---

## 18. Arabic / English Localization

### Language Storage

The current language is stored in `localStorage` under the key `hn_lang`. Default value when absent: `"ar"` (Arabic).

### Translation Data

All translations are in `js/i18n.js` in the `I18N` object:

```javascript
const I18N = {
  ar: { add_to_cart: "أضف إلى السلة", ... },
  en: { add_to_cart: "Add To Cart",   ... }
};
```

Full key list includes: `search_placeholder`, `our_picks`, `add_to_cart`, `buy_now`, `description`, `cart`, `shop`, `cart_title`, `cart_empty`, `continue_shopping`, `total`, `proceed_checkout`, `checkout_title`, `first_name`, `last_name`, `address`, `email`, `phone`, `place_order`, `order_summary`, `remove`, `da` (currency), `home`, `order_success_title`, `order_success_text`, `back_home`, `required_field`, `invalid_email`, `invalid_phone`, `flavor`, `weight`, `state`, `municipality`, `address_optional`.

### RTL / LTR Switching

```javascript
document.documentElement.lang = lang;
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
```

Setting `dir` on the root `<html>` element causes the entire page to mirror. All flex containers, text alignment, and margins switch automatically via CSS logical properties.

### Static HTML Elements (`data-i18n`)

For elements that exist in the static HTML:
```html
<span data-i18n="add_to_cart">Add To Cart</span>
```
`Lang.apply()` sets `el.textContent = Lang.t(key)` for each matching element.

For placeholder attributes:
```html
<input data-i18n-placeholder="search_placeholder">
```
`Lang.apply()` sets `el.setAttribute("placeholder", Lang.t(key))`.

### Dynamically Injected HTML

For HTML generated by JavaScript template literals (product page, checkout form, cart), `data-i18n` attributes are NOT used because `Lang.apply()` runs before the HTML is injected and won't reach it. Instead, `Lang.t("key")` is called inline:

```javascript
return `<button>${Lang.t("add_to_cart")}</button>`;
```

When the language changes, the entire component re-renders by calling `renderProduct(CURRENT_PRODUCT, e.detail.lang)` — which replaces the innerHTML with freshly translated content.

### Phone Number RTL Fix

Phone numbers and numeric strings must not be mirrored by RTL layout. They are wrapped in `dir="ltr"`:

```html
<div dir="ltr">📞 0776 82 00 72 &nbsp;|&nbsp; Khroub, Constantine</div>
```

---

## 19. UI Design Principles

### Color Palette (Customer Site)

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#f5f4f0` | Page background (off-white) |
| `--paper` | `#ffffff` | Card backgrounds |
| `--ink` | `#111111` | Primary text |
| `--steel` | `#6b6b6b` | Secondary text |
| `--line` | `#e0dfdb` | Borders and dividers |
| `--accent` | `#ff5a1f` | Primary brand orange (buttons, active states) |
| `--forge` | `#1a1a1a` | Dark button background |

### Color Palette (Admin Dashboard)

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0f0f0f` | Page background (near-black) |
| `--surface` | `#1a1a1a` | Card and panel backgrounds |
| `--surface2` | `#242424` | Table header backgrounds |
| `--border` | `#2e2e2e` | Borders |
| `--accent` | `#ff5a1f` | Brand orange |
| `--text` | `#f0f0f0` | Primary text |
| `--muted` | `#888888` | Secondary text |
| `--danger` | `#e53e3e` | Red for errors and danger actions |
| `--success` | `#38a169` | Green for success states |

### Typography

**Customer site:**
- `Bebas Neue` — hero section headings, category labels, section titles
- `Inter` — English body text
- `Tajawal` — Arabic body text (loaded from Google Fonts)

**Admin:**
- `Inter, system-ui, sans-serif` — all admin text

### Buttons

**Customer:**
- `.btn-primary` — orange background, white text, rounded, used for primary actions
- `.btn-dark` — near-black background, white text, used for secondary actions like "Add To Cart"
- `.add-cart-btn` — full-width within product card, uses `--accent` on hover

**Admin:**
- `.btn-primary` — orange, used for save/confirm actions
- `.btn-ghost` — transparent with border, used for secondary actions
- `.btn-danger` — dark red background, red text, used for delete/cancel
- `.btn-success` — dark green background, green text, used for confirm order
- `.btn-sm` — reduced padding for table action buttons
- `.btn:disabled` — opacity 0.4, `pointer-events: none`

### Cards

**Product card (`.product-card`):** White rounded card with shadow on hover. Contains image, category badge, name, stars, price row, and "Add To Cart" button.

**Category card (`.category-card`):** Compact pill/box button with category name and item count. Active state has orange border and background tint.

**Admin stat card:** Dark surface card with a label and large bold number.

### Layout

**Customer:** Single-column on mobile, responsive grid (auto-fill, min 220px) for products on desktop. Header has logo | search | cart in a three-column flex layout.

**Admin:** Full-width table layout inside a `max-width: 1100px` centered container.

### Flavor Circle CSS

```css
.flavor-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--fc, #cccccc);
  border: 3px solid transparent;
  cursor: pointer;
}
.flavor-circle.active {
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--ink);
}
```

### Image Arrows (Product Page)

```css
.img-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,0.42);
}
.img-arrow-prev { left: 8px; }
.img-arrow-next { right: 8px; }
```

### Responsive Breakpoints

- Mobile bottom nav visible below ~600px
- Product grid collapses to 2 columns on tablet, 1 on small mobile
- Admin modal: `max-width: 620px`, full-width on small screens with `padding: 20px`
- Admin grid collapses from 2 columns to 1 on `max-width: 600px`

---

## 20. Git Workflow

### Current Branch State

```bash
git status                          # show changed files
git diff                            # show unstaged changes
git log --oneline                   # show recent commits
```

### Committing Changes

```bash
git add specific-file.js            # prefer specific files over "git add ."
git add routes/admin.js routes/orders.js homenutrition/admin/index.html
git commit -m "Add order confirm/cancel with stock decrement"
```

### Good Commit Message Format

```
<type>: <short description>

Types: feat, fix, refactor, docs, style, chore
Examples:
  feat: Add order status filter tabs to admin
  fix: Checkout summary using base price instead of variant price
  fix: Cart merge bug when adding multiple variants of same product
  feat: Inventory tracking per variant with qty cap on product page
```

### Rolling Back to a Previous Commit

```bash
git log --oneline                  # find the commit hash
git checkout abc1234 -- path/to/file.js   # restore single file
git reset --hard abc1234           # DESTRUCTIVE: reset all files to that commit
git revert abc1234                 # safe: creates a new "undo" commit
```

### Best Practices for This Project

- Commit after each working feature — not during
- Never commit `homenutrition.db` (add to `.gitignore`)
- Never commit `.env` (add to `.gitignore`)
- Test the server starts cleanly (`node server.js`) before committing backend changes

---

## 21. How to Run the Project

### Prerequisites

- **Node.js v22.5 or higher** — required for built-in `node:sqlite`. Node.js v24 is recommended. Download from https://nodejs.org
- **Windows PowerShell** — the primary shell for this environment

### PowerShell Execution Policy

If PowerShell blocks script execution:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Installation Steps

```bash
# 1. Clone or copy the project folder
cd C:\Users\YourName\Documents\web\ecomerce\gym7

# 2. Install dependencies
npm install

# 3. (Optional) Create a .env file for configuration
# Create a file named .env in the project root:
# ADMIN_PASSWORD=yourSecurePassword
# JWT_SECRET=your-long-random-secret-string
# PORT=3000

# 4. Start the development server (auto-restarts on file changes)
npm run dev

# 5. OR start for production (no auto-restart)
npm start
```

### Server URLs

| URL | Description |
|---|---|
| `http://localhost:3000/` | Customer homepage |
| `http://localhost:3000/cart.html` | Shopping cart |
| `http://localhost:3000/checkout.html` | Checkout page |
| `http://localhost:3000/pages/product.html?slug=xxx` | Product detail |
| `http://localhost:3000/admin/` | Admin dashboard |
| `http://localhost:3000/api/products/` | Products API |

### Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123` (if no `ADMIN_PASSWORD` in `.env`)

**Change this before going live** — set `ADMIN_PASSWORD=yourpassword` in `.env` and the seed code will use it on first run (only creates the admin account if none exists).

### Common Problems

**"Cannot find module 'node:sqlite'"**
→ Your Node.js version is below v22.5. Upgrade Node.js.

**"SQLITE_ERROR: table xxx already has column yyy"**
→ This should never happen because migrations use `try/catch`. If it does, the database is corrupted. Delete `homenutrition.db` and restart (you will lose all data).

**Admin login says "Invalid or expired token" immediately**
→ JWT_SECRET changed between sessions. Clear `hn_admin_token` from localStorage in browser DevTools and log in again.

**Images not showing after upload**
→ Check that `uploads/products/` folder exists and is writable. The server creates it on startup but may fail if permissions are restricted.

**Port 3000 already in use**
→ Either kill the existing process (`Get-Process -Name node | Stop-Process`) or change the port in `.env`: `PORT=3001`.

---

## 22. Future Improvements

### Immediate Priority

1. **Low stock alerts in admin** — highlight variants with `stock_qty ≤ 5` in the product table with a yellow badge
2. **Order count stat card** — add pending/confirmed/total order counts to the admin stats row
3. **Email notifications** — send order confirmation email to customer and notification email to admin using nodemailer

### Customer Experience

4. **Wishlist** — save products to a favorites list in localStorage
5. **Product reviews and ratings** — allow customers to submit star ratings and text reviews
6. **Related products** — show 4 products from the same category on each product page
7. **Promo / discount codes** — admin creates coupon codes with percentage or fixed-amount discount; customer enters code at checkout
8. **Product share buttons** — share product link on WhatsApp, Facebook, Instagram
9. **Recently viewed products** — track last 5 viewed products in localStorage and show at the bottom of the homepage

### Admin Dashboard

10. **Sales analytics** — total revenue chart by day/week/month, top-selling products, top categories
11. **Customer list** — extract unique customers from orders with their order history
12. **Bulk stock update** — change stock_qty for multiple variants at once
13. **Order search / filter by date** — search orders by customer name, phone, or date range
14. **Print order invoice** — formatted printable invoice for confirmed orders
15. **Admin activity log** — track when orders were confirmed/cancelled and by whom
16. **Multiple admin accounts** — support more than one admin user with different access levels

### Technical Improvements

17. **Payment gateway integration** — integrate CIB, Dahabia (Algerian cards), or cash-on-delivery confirmation
18. **SMS notifications** — send order confirmation SMS using an Algerian SMS gateway API
19. **Image optimization** — resize and compress uploaded images server-side using `sharp`
20. **Barcode / QR code per product** — for physical inventory management
21. **Export orders to Excel/CSV** — for offline accounting
22. **Rate limiting** — prevent brute-force attacks on login and order submission endpoints
23. **Helmet.js** — security headers for the Express app
24. **Automatic backup** — scheduled SQLite database backup to a remote location
25. **Product import via Excel/CSV** — bulk add products without using the UI
26. **Multi-store support** — configure multiple store branches from one admin

### Shipping

27. **Wilaya-based delivery pricing** — different delivery cost per wilaya
28. **Shipping partner integration** — Yalidine, Zr Express, or other Algerian couriers API
29. **Order tracking page** — customer can track order status with their reference number

---

## 23. Architecture Decisions

### Why SQLite instead of PostgreSQL or MySQL?

**Decision:** Use Node.js built-in `node:sqlite` with a file-based SQLite database.

**Reason:** This is a single-store, single-admin application with modest traffic (a small Algerian supplement shop). SQLite is:
- Zero configuration — no database server to install or maintain
- The entire database is one file (`homenutrition.db`) that can be backed up by copying it
- `node:sqlite` is built into Node.js v22.5+ — no additional npm dependency
- Sufficient for hundreds of daily orders without performance issues

**Trade-off:** Not suitable for high-concurrency writes (multiple admins doing simultaneous bulk imports) or horizontal scaling across multiple servers. WAL mode (`PRAGMA journal_mode = WAL`) mitigates concurrent read performance.

### Why `node:sqlite` instead of `better-sqlite3`?

**Decision:** Use the built-in `node:sqlite` module.

**Reason:** `better-sqlite3` has pre-built native binaries for specific Node.js versions. Node.js v24 was too new when development started and `better-sqlite3` had no prebuilt binary for it, causing installation failures. The built-in module has no such version dependency.

**Trade-off:** `node:sqlite`'s `DatabaseSync` lacks the `db.pragma()` and `db.transaction()` helpers that `better-sqlite3` provides. This required using explicit `db.exec("BEGIN/COMMIT/ROLLBACK")` for transactions and `db.exec("PRAGMA ...")` for configuration.

### Why no frontend framework (React, Vue, etc.)?

**Decision:** Vanilla JavaScript with no build step.

**Reason:**
- The project has only 4 customer pages and 1 admin page — no need for component routing
- No build tooling means faster iteration, easier deployment, and no `npm run build` step
- The entire frontend can be developed by editing HTML/JS files and refreshing the browser
- No JavaScript bundle size concerns — scripts are small

**Trade-off:** More verbose event listener management. Solved with event delegation patterns.

### Why a Single Admin HTML File?

**Decision:** The entire admin dashboard is one `admin/index.html` file with embedded JavaScript.

**Reason:**
- Easy to understand and modify — everything is in one place
- No build process or module bundler required
- Can be opened directly in a browser for visual inspection even without the server

**Trade-off:** The file becomes long (800+ lines). Mitigated by clear section comments.

### Why JWT in localStorage instead of cookies?

**Decision:** Store the admin JWT in `localStorage.hn_admin_token`.

**Reason:** Simpler implementation. No need to configure `SameSite`, `HttpOnly`, `Secure` cookie attributes. The admin panel is a trusted internal tool, not a public-facing authentication system.

**Trade-off:** `localStorage` is accessible to JavaScript (XSS risk). For a high-security environment, `HttpOnly` cookies would be more appropriate.

### Why Stock is Reduced at Confirmation, Not at Order?

**Decision:** `status = 'pending'` orders do not reduce stock. Only confirmed orders reduce stock.

**Reason:** The business model is phone-based confirmation. The owner calls every customer before dispatching. 30–50% of pending orders may be cancelled (wrong number, changed mind, test order). Reducing stock at order placement would:
- Block real customers from buying the last unit if a test order is pending
- Require a "reverse stock on cancel" mechanism that adds complexity
- Create inaccurate stock numbers during the pending period

**Trade-off:** Two customers could theoretically both place orders for the last unit. The first admin to click "Confirm" succeeds; the second gets a stock error and must manually cancel and contact the customer.

### Why Variant Images Are Optional?

**Decision:** `product_variants.image` is nullable.

**Reason:** Many supplement products look the same regardless of flavor (same bag, different label). Requiring an image per variant would force the admin to upload the same product image multiple times. When `v.image` is null, the product's main image is used as fallback.

### Why Order Items Store Flavor/Weight as Text Snapshots?

**Decision:** `order_items.flavor` and `order_items.weight` store text snapshots, not foreign keys.

**Reason:** The admin needs to know what was ordered even years later, even if the product's variants are renamed or deleted. A foreign key would make the item unreadable if the variant is deleted. The text snapshot is immutable — it records what the product was called at order time.

**Trade-off:** If the admin corrects a typo in a flavor name, old orders continue to show the old name. This is actually the correct behavior for an order history system.

### Why Cart Items Store Flavor Labels Directly?

**Decision:** Cart items store `flavor_en`, `flavor_ar`, and `weight` text in addition to `variant_id`.

**Reason:** The cart page and checkout page need to display these labels without making additional API calls per cart item. By storing the labels at add-time, the display can be purely from localStorage data.

---

## 24. Developer Notes

### Assumptions

1. **Single currency:** All prices are in Algerian Dinar (DZD). No multi-currency support.
2. **Single language for admin:** Admin dashboard is English-only. The admin is expected to read English.
3. **Algerian phone numbers:** The phone validation regex `^0[5-7][0-9]{8}$` assumes Algerian mobile format. International numbers are rejected.
4. **One admin account:** The system was designed for exactly one admin. The `admin` table has no role system.
5. **Manual order fulfillment:** No payment gateway. The business model is: customer orders online → admin calls → admin ships → customer pays on delivery.
6. **Product slugs are permanent:** Changing a slug after a product has been shared (on social media, WhatsApp) will break those links.

### Implementation Details

**`products` table `in_stock` vs `stock_qty`:**
- When `stock_qty` is NULL: `in_stock` is the authoritative source. Admin toggles manually.
- When `stock_qty` is an integer: `in_stock` is derived automatically. Setting `stock_qty = 0` makes `in_stock = 0`. Setting `stock_qty = 5` makes `in_stock = 1`. The admin should not manually change `in_stock` when `stock_qty` is set — it will be overwritten on next save.

**`applyVariantDefaults` in the products API:**
The public products list overrides the top-level product fields with the first variant's values. This means the homepage product card shows the cheapest (first) variant's price. The admin product table shows the product's raw base price from the `products` table, not the variant price.

**FK-safe deletion order:**
Because `node:sqlite` enforces foreign key constraints by default (`enableForeignKeyConstraints: true`), you CANNOT delete a `products` row while `product_variants` rows reference it — even though `ON DELETE CASCADE` is defined. The CASCADE was not reliably triggering in testing. The fix was to manually delete in this exact order:
```
product_variants → product_flavors → order_items → products
```

**`saveFlavors` replaces all variants:**
Every time a product is saved with variants, ALL existing flavors and variants for that product are deleted and re-inserted. There is no incremental update. This simplifies the save logic significantly but means you cannot update a single variant's stock without going through the full product save flow (the admin panel does this automatically).

**Order reference format:**
`ORD-` + `Date.now()` gives a timestamp-based unique reference like `ORD-1782527663360`. Since `Date.now()` is millisecond-precision and orders are placed one at a time, collisions are extremely unlikely. The `UNIQUE` constraint on `order_ref` is the database-level safety net.

**Cart purging on cart page load:**
The cart page fetches all products on every load and removes cart items for products that no longer exist. This prevents the cart from showing phantom items if the admin deleted a product while a customer had it in their cart.

**Language defaults to Arabic:**
```javascript
get() {
  return localStorage.getItem(this.KEY) || "ar";
}
```
First-time visitors see Arabic with RTL layout. This matches the primary target market.

**Hero text is not translatable via `data-i18n`:**
The hero heading and subtitle use custom `data-i18n-hero` and `data-i18n-hero-sub` attributes, handled by `applyHeroText(lang)` in `home.js`. This is because the text is longer and stored in the `HERO` object rather than `I18N`.

---

## 25. How to Reuse This Project

This project is a complete template for a Algerian (or similar market) supplement e-commerce store. To adapt it for a different store, you only need to change branding and content — the architecture stays identical.

### Step 1: Branding

**Logo:**
- Replace `homenutrition/images/logo.png` with your store's logo
- The logo appears in the header and hero section
- Recommended size: 120×120px or 200×200px square

**Store name:**
- Search for `"Home Nutrition"` across all files and replace with your store name
- Key locations:
  - `homenutrition/index.html` — `<title>`, `.logo-text`, footer
  - `homenutrition/cart.html` — same locations
  - `homenutrition/checkout.html` — same
  - `homenutrition/pages/product.html` — same
  - `homenutrition/admin/index.html` — topbar brand
  - `homenutrition/js/home.js` — HERO text

**Colors:**
- Customer site: edit CSS custom properties at the top of `homenutrition/css/style.css`:
  ```css
  :root {
    --accent: #ff5a1f;   /* ← change to your brand color */
  }
  ```
- Admin panel: edit CSS custom properties at the top of `homenutrition/admin/index.html`:
  ```css
  :root {
    --accent: #ff5a1f;   /* ← same brand color */
  }
  ```

**Contact information:**
- Footer phone number: search `0776 82 00 72` and replace
- Footer city: search `Khroub, Constantine` and replace
- These appear in `index.html`, `cart.html`, `checkout.html`, `pages/product.html`

### Step 2: Content

**Delete sample products:**
The database is seeded with sample products on first run. On the first real deployment:
1. Either clear the seed data from `db.js` (remove the `if (productCount === 0)` block)
2. Or log in as admin and delete the seeded products manually

**Add real products:**
Through the admin dashboard at `/admin/`:
- Product names in both Arabic and English
- Category names in both languages
- Images (upload or use URLs)
- Prices in DZD
- Flavors with colors (if applicable)
- Weight variants with prices and stock quantities

**Update translations:**
In `homenutrition/js/i18n.js`, update any store-specific strings:
- `our_picks` — your store's section heading
- `order_success_text` — delivery confirmation message
- Add or remove keys as needed

**Categories:**
Categories are free-text on each product. To change the available categories, just add products with the new category name. The category filter on the homepage will automatically include it.

To add a new category icon, add an entry to `CATEGORY_ICONS` in `home.js`:
```javascript
const CATEGORY_ICONS = {
  "Supplements": `<svg ...>...</svg>`,
  // ...
};
```
(Note: Icons were removed from category buttons in this project but the system supports them.)

### Step 3: Environment

Create a `.env` file:
```
ADMIN_PASSWORD=your-very-secure-password-here
JWT_SECRET=a-long-random-string-at-least-32-characters
PORT=3000
```

### Step 4: Deployment

For local use (store owner's computer):
```bash
npm install
npm start
# Visit http://localhost:3000
```

For internet deployment (VPS):
- Install Node.js v22.5+ on the server
- Use `pm2` to keep the server running: `pm2 start server.js --name storename`
- Use Nginx as a reverse proxy on port 80/443
- Use `certbot` for HTTPS

### What Does NOT Need to Change

- The entire database schema
- All 15 API routes
- The cart system
- The checkout flow
- The order management system
- The inventory tracking system
- The image upload system
- The JWT authentication
- The bilingual AR/EN system
- The RTL/LTR switching

The architecture is store-agnostic. Only the content (products, branding, contact info) is store-specific.

---

*End of documentation.*

*This document was generated as part of the Home Nutrition project and reflects the state of the codebase as of June 2026.*

*For questions or issues, refer to the source code in the project files listed in Section 2.*
