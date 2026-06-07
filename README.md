# Jurniture - Handcrafted Timber Furniture Inventory & E-Commerce Platform

Welcome to **Jurniture** (Palamoottil Wood Industries and Furniture / Teak & Timber), a full-stack, responsive web application designed for furniture showroom management, inventory tracking, and consumer catalog browsing. The backend is powered by Node.js, Express, and MongoDB, while the frontend is built using Vanilla HTML, CSS (via Tailwind CSS classes and blueprint aesthetics), and modern JavaScript.

---

## 📂 Project Directory Structure

```text
jurniture/
├── .env                     # Local environment & config credentials
├── package.json             # Node dependencies and scripts
├── server.js                # App entrypoint, Express setup & DB seeding
├── config/                  # Database and 3rd-party configuration
│   ├── db.js                # MongoDB Mongoose connection utility
│   └── cloudinary.js        # Cloudinary integration for image uploads
├── middleware/              # Express request interceptors / guards
│   ├── auth.js              # JWT authentication & extraction middleware
│   ├── admin.js             # Admin authorization guard (req.user.isAdmin check)
│   └── upload.js            # Multer memory storage configuration
├── models/                  # MongoDB Mongoose database schemas
│   ├── User.js              # User model (bcrypt passwords, isAdmin flag)
│   ├── Product.js           # Product model (name, price, stock status, specs)
│   └── Category.js          # Category model (furniture category list & icons)
├── routes/                  # Express controller route definitions
│   ├── auth.js              # Authentication endpoints (/register, /login, /admin-login)
│   ├── products.js          # Product CRUD endpoints (protect, admin & upload guards)
│   └── categories.js        # Category retrieval & management endpoints
└── public/                  # Static frontend served directly by Express
    ├── index.html           # E-commerce store homepage catalog
    ├── product.html         # Dynamic product details page
    ├── login.html           # Unified login, register & admin access page
    ├── admin.html           # Interactive admin dashboard (inventory manager)
    ├── categories.html      # Category listing / catalog helper page
    ├── User.js              # (Unused/Archived copy of User schema)
    ├── css/                 # Styling directories
    └── js/                  # Client-side controller scripts
        ├── api.js           # Shared API fetch wrapper for backend endpoints
        ├── auth.js          # Client token and session localStorage utility
        ├── login.js         # Register, Login, & Admin-Login UI handler
        ├── main.js          # Storefront controller (filtering, search, stock counts)
        ├── product.js       # Detail-view loader (spec binding from DB details)
        ├── admin.js         # Dashboard interactions (Create, Edit, Delete UI flow)
        └── categories.js    # Client-side categories utilities
```

---

## 🔍 Detailed Component Breakdown

### 1. Root Configuration & Server Entry
* **`server.js`**: Initializes the Express framework, configures middleware to parse payload bodies, seeds default data (admin user credentials `admin@teaktimber.com` / `admin123` and default category items), links backend routes, and acts as the entrypoint running on port `5000` (or `process.env.PORT`).
* **`.env`**: Stores secret database connections (`MONGODB_URI`), authorization salts (`JWT_SECRET`), admin login passkey credentials (`ADMIN_PASSKEY`), and Cloudinary credentials.
* **`package.json`**: Outlines execution scripts and core package dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `multer`, `cloudinary`, `dotenv`).

### 2. Backend Config & Middleware (`/config` & `/middleware`)
* **`config/db.js`**: Implements the promise-based connection pool to MongoDB via Mongoose.
* **`config/cloudinary.js`**: Integrates the Cloudinary CDN service for storage and retrieval of uploaded furniture product images.
* **`middleware/auth.js`**: Intercepts request headers to extract standard JSON Web Tokens (`Authorization: Bearer <token>`) and loads corresponding user details onto the request object.
* **`middleware/admin.js`**: Restricts sensitive endpoints to users with administrative authorization (`req.user.isAdmin === true`).
* **`middleware/upload.js`**: Integrates **Multer** to parse multipart form payloads (`multipart/form-data`) and hold images temporarily in memory buffer before they are sent to Cloudinary.

### 3. Database Models (`/models`)
* **`User.js`**: Mongoose schema mapping user profiles. Contains a built-in method (`matchPassword`) to compare incoming passwords with encrypted hashes.
* **`Product.js`**: Defines structural requirements for items (such as `material`, `dimensions`, `price`, `image` CDN URL, and enum statuses like `'In Stock'`, `'Out of Stock'`, or `'Made to Order'`).
* **`Category.js`**: Outlines categories of interest (e.g., `'Beds'`, `'Windows'`, `'Doors'`, `'Chairs'`, `'Dining Tables'`).

### 4. API Endpoint Routing (`/routes`)
* **`routes/auth.js`**: Registers standard users, logs in standard users, and provides the secure `/admin-login` endpoint validating passwords as well as the administrative passkey security code.
* **`routes/products.js`**: Handles public product listings and single-product queries. Modifying operations (`POST`, `PUT`, `DELETE`) require active admin privileges. Supports both image uploads via Multer and fallback image URL strings.
* **`routes/categories.js`**: Manages backend-driven lists of categories and details.

### 5. Frontend Client Assets (`/public`)
* **`index.html` / `main.js`**: Orchestrates the user experience on the homepage shop catalog. Displays categorized items with live count badges, offers text search, and features clean navigation menus.
* **`product.html` / `product.js`**: Triggers when a user selects a product card. Dynamically fetches details by ID and renders dynamic descriptions, pricing, availability badges, material specs, and dimensions.
* **`login.html` / `login.js`**: Serves as the authentication gate. Automatically routes standard accounts and prompts administrative passkeys for administrator logins.
* **`admin.html` / `admin.js`**: The administrator console interface. Includes tools to edit active products, delete existing inventory items, upload image files directly from local storage, and create new catalog items in real-time.
* **`js/api.js`**: Centralized API request wrapper keeping client-side AJAX calls clean, structured, and consistent.
* **`js/auth.js`**: Manages browser cookie/local storage persistence for JWT authentication tokens and current user payload structures.
