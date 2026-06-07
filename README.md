# Jurniture — Timber Furniture Store

Vibecoded full-stack furniture e-commerce app for Palamoottil Wood Industries and Furniture (Teak & Timber).

Built with Node.js, Express, MongoDB, and plain HTML/CSS/JavaScript.

---

## Project Structure
jurniture/
├── .env                     # Secret keys (never share or upload this)
├── package.json             # Project dependencies
├── server.js                # App entry point
├── config/
│   ├── db.js                # MongoDB connection
│   └── cloudinary.js        # Image storage setup
├── middleware/
│   ├── auth.js              # Checks if user is logged in
│   ├── admin.js             # Checks if user is admin
│   └── upload.js            # Handles image file uploads
├── models/
│   ├── User.js              # User accounts and passwords
│   ├── Product.js           # Furniture items
│   └── Category.js          # Furniture categories
├── routes/
│   ├── auth.js              # Login, register, admin-login
│   ├── products.js          # Product CRUD
│   └── categories.js        # Category management
└── public/
├── index.html           # Homepage
├── product.html         # Product detail page
├── login.html           # Login and register
├── admin.html           # Admin dashboard
└── js/
├── api.js           # All API calls
├── auth.js          # Token management
├── login.js         # Login/register logic
├── main.js          # Homepage logic
├── product.js       # Product detail logic
├── admin.js         # Admin dashboard logic
└── categories.js    # Category logic

---

## Setup
npm install
npm start

Open http://localhost:5000

Default admin account (created automatically on first run):
- Email: admin@teaktimber.com
- Password: admin123
- Passkey: set in .env as ADMIN_PASSKEY

---

## Environment Variables

Create a file named .env in the root of the project and fill in the following:
MONGODB_URI=
JWT_SECRET=
ADMIN_PASSKEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=

The .env file is listed in .gitignore and will never be pushed to GitHub.
If you are cloning this project, create your own .env file manually using the keys above.
Never share this file or commit it to version control.

For Gmail to send emails, generate an App Password at myaccount.google.com/apppasswords
and paste the 16-character code without spaces as GMAIL_APP_PASSWORD.

---

## Notes

- No payment gateway. Orders are placed by customers and confirmed manually by admin.
- Cart data is stored in localStorage and clears on logout.
- Product images are hosted on Cloudinary. A free account is required.
- Admin routes are protected on both the frontend and backend.Sonnet 4.6 LowClaude is AI and can make mistakes. Please double-check responses.Sharepersistence for JWT authentication tokens and current user payload structures.
