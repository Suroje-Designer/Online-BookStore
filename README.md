# Pageturn - Online Bookstore

A full-stack online bookstore built with the **MERN** stack: MongoDB Atlas, Express.js, React (Vite) and Node.js.
Customers can browse and search books, keep a cart, check out and review what they read. Admins manage books,
categories, orders and reviews from a dashboard.

## Features

**Customers**
- Register / login with JWT authentication (tokens expire after 7 days)
- Browse books with search (title or author), category filter and sorting
- Book page with cover, price, stock, ISBN, average rating and reviews
- Cart with quantity controls and stock validation
- Checkout with shipping address and payment method (Cash on Delivery or Online - simulated)
- Order history with details, and cancellation while an order is Pending or Confirmed (stock is restored)
- One review per user per book; users can delete their own reviews

**Admins**
- Dashboard: books, categories, orders, users, reviews, revenue, pending orders and low-stock alerts
- Book management: add, edit, delete, quick stock updates
- Category management: add, rename, delete (blocked while books use the category)
- Order management: view all orders, filter by status, update status (Pending / Confirmed / Shipped / Delivered / Cancelled)
- Review moderation: view and delete any review

## Technology stack

| Layer | Tools |
|---|---|
| Database | MongoDB Atlas + Mongoose |
| Backend | Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv` |
| Frontend | React 18 + Vite, React Router, Axios, Context API (Auth, Cart, Toast) |

## Architecture

```
React (Vite)  --Axios + JWT-->  Express REST API  --Mongoose-->  MongoDB Atlas
 Context API                    routes -> middleware -> controllers -> models
```

- **Routes** map URLs to controllers; **middleware** handles authentication (`protect`), authorization (`admin`) and errors.
- **Controllers** contain the business logic (stock checks, checkout, cancellation).
- The frontend keeps the JWT in `localStorage` and an Axios interceptor attaches it to every request. If the server answers 401 for a stored token, the session is cleared automatically.
- Checkout reduces stock with an atomic conditional update per book (`stock >= quantity`) and rolls back if any step fails, so two buyers cannot both purchase the last copy.

## Folder structure

```
online-bookstore/
├── backend/
│   ├── config/db.js                 MongoDB connection
│   ├── controllers/                 auth, book, category, cart, order, review, admin
│   ├── middleware/                  authMiddleware.js, errorMiddleware.js
│   ├── models/                      User, Book, Category, Cart, Order, Review
│   ├── routes/                      one router per resource
│   ├── utils/                       generateToken.js, asyncHandler.js
│   ├── seed.js                      demo data
│   ├── server.js                    app entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              Navbar, BookCard, BookCover, ProtectedRoute, ...
│   │   ├── context/                 AuthContext, CartContext, ToastContext
│   │   ├── pages/                   Home, Books, BookDetails, Cart, Checkout, Orders, ... + admin/
│   │   ├── services/api.js          Axios instance + JWT interceptor
│   │   ├── utils/format.js
│   │   ├── App.jsx, main.jsx, styles.css
│   ├── index.html, vite.config.js
│   └── .env.example
├── postman/Online-Bookstore.postman_collection.json
└── README.md
```

## Requirements

- Node.js 18 or newer (20+ recommended) and npm
- A free MongoDB Atlas account

## MongoDB Atlas setup

1. Sign in at <https://www.mongodb.com/cloud/atlas> and create a free **M0** cluster.
2. **Database Access** -> *Add New Database User*. Choose a username and password and give it *Read and write to any database*.
3. **Network Access** -> *Add IP Address*. Add your current IP, or `0.0.0.0/0` for development only.
4. **Database** -> *Connect* -> *Drivers*. Copy the connection string, which looks like
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`.
5. Insert a database name before the `?`, for example `.../bookstore?retryWrites=true&w=majority`.
   If your password has special characters (`@`, `:`, `/`, `#`), URL-encode them.

## Environment variables

**backend/.env** (copy from `backend/.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Use a long random string for `JWT_SECRET`, for example:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Optional: `JWT_EXPIRES_IN` (default `7d`) and `CLIENT_URL` (comma-separated allowed origins; any origin is allowed if unset).

**frontend/.env** (copy from `frontend/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
```

> Never commit `.env` files. They are listed in `.gitignore`.

## Installation and running

### Backend

```bash
cd backend
cp .env.example .env     # then edit .env  (Windows: copy .env.example .env)
npm install
npm run dev
```

The API runs on <http://localhost:5000>. Check <http://localhost:5000/api/health>.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs on <http://localhost:5173>.

### Seed the database

```bash
cd backend
npm run seed
```

> **Warning:** the seed script deletes all existing users, categories, books, carts, orders and reviews in the database from `MONGO_URI` before inserting demo data.

It creates 2 users, 5 categories, 13 books and a few reviews.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin123 |
| User | user@example.com | User123 |

## API endpoints

Base URL: `http://localhost:5000/api`. "Auth" = needs `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account (role is always `user`) |
| POST | `/auth/login` | Public | Log in, returns token |
| GET | `/auth/profile` | Auth | Current user |
| GET | `/books` | Public | List. Query: `search`, `category`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `title`), `featured=true`, `limit` |
| GET | `/books/:id` | Public | Single book |
| POST | `/books` | Admin | Create book |
| PUT | `/books/:id` | Admin | Update book (partial updates allowed) |
| DELETE | `/books/:id` | Admin | Delete book (also removes its reviews and cart entries) |
| GET | `/categories` | Public | List with book counts |
| POST | `/categories` | Admin | Create |
| PUT | `/categories/:id` | Admin | Rename |
| DELETE | `/categories/:id` | Admin | Delete (fails if books use it) |
| GET | `/cart` | Auth | Current cart |
| POST | `/cart` | Auth | Add `{ bookId, quantity }` |
| PUT | `/cart/:bookId` | Auth | Set quantity `{ quantity }` |
| DELETE | `/cart/:bookId` | Auth | Remove a book |
| DELETE | `/cart` | Auth | Clear cart |
| POST | `/orders` | Auth | Checkout `{ shippingAddress, paymentMethod }` |
| GET | `/orders/myorders` | Auth | Your orders |
| GET | `/orders/all` | Admin | All orders (`?status=`) |
| GET | `/orders/:id` | Owner/Admin | Order details |
| PUT | `/orders/:id/cancel` | Owner/Admin | Cancel (Pending or Confirmed only), restores stock |
| PUT | `/orders/:id/status` | Admin | Update status `{ status }` |
| GET | `/reviews/book/:bookId` | Public | Reviews + average rating |
| POST | `/reviews/book/:bookId` | Auth | Add `{ rating, comment }` (one per user per book) |
| DELETE | `/reviews/:id` | Owner/Admin | Delete review |
| GET | `/reviews` | Admin | All reviews |
| GET | `/admin/stats` | Admin | Dashboard statistics |

Errors are returned as `{ "message": "..." }` with a suitable HTTP status (400, 401, 403, 404, 500).

## Postman usage

1. Import `postman/Online-Bookstore.postman_collection.json`.
2. The collection variable `baseUrl` is `http://localhost:5000/api`.
3. Run **Auth -> Login (admin)** (or *Login (user)*). A test script saves the token into `{{token}}`, which every other request uses via collection-level Bearer auth.
4. Run **Categories -> List categories** and **Books -> List books** to fill `{{categoryId}}` and `{{bookId}}`. Order and review requests save `{{orderId}}` and `{{reviewId}}` the same way.

## Production build

```bash
cd frontend
npm run build      # outputs frontend/dist
npm run preview    # optional local preview

cd ../backend
NODE_ENV=production npm start
```

Set `VITE_API_URL` to your deployed API URL **before** building the frontend, and set `CLIENT_URL` on the backend to your frontend's origin.
Serve `frontend/dist` from any static host. Because the app uses client-side routing, configure the host to fall back to `index.html` for unknown paths.

## Troubleshooting

| Problem | Fix |
|---|---|
| `MONGO_URI is not set` | Create `backend/.env` from `.env.example` and add your Atlas string. |
| `MongooseServerSelectionError` / timeouts | Add your IP in Atlas *Network Access*; check your internet/firewall. |
| `bad auth` / `Authentication failed` | Wrong database username or password; URL-encode special characters in the password. |
| `JWT_SECRET is not set` | Set a real value in `backend/.env` (not the placeholder). |
| Frontend shows "Cannot reach the server" | Start the backend, and make sure `VITE_API_URL` matches its address. Restart `npm run dev` after editing `.env`. |
| CORS errors | Set `CLIENT_URL=http://localhost:5173` in `backend/.env`, or remove it to allow all origins. |
| Port 5000 already in use | Change `PORT` in `backend/.env` and update `VITE_API_URL`. (On macOS, AirPlay Receiver can occupy port 5000.) |
| No books shown | Run `npm run seed` in `backend`. |
| Book covers show a plain colored cover | Seed covers load from openlibrary.org; the app falls back to a generated cover if an image is unavailable. |

## Notes

- "Online" payment is a simulation: no payment provider is integrated and no card data is collected.
- Public registration always creates a `user`. Create more admins by changing a user's `role` to `admin` in Atlas, or via the seed script.
