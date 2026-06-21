# 🏠 Renteasy — Server Side

This is the Server/Backend repository for the Property Rental & Booking Platform. Built with Node.js, Express, and MongoDB, this RESTful API handles authentication, role-based access control, property management, booking workflows, payments, and admin moderation.

---

## 🔗 Live & Repo Links

| Resource | Link |
|---|---|
| ⚙️ Server Live API | https://property-rental-server.vercel.app/ |
| 💻 Client Repository |https://github.com/nowshintisha230/property-rental-client |
| Project live Link | https://property-rental-client-kappa.vercel.app/
---

## 🎯 Purpose

This server provides secure API endpoints for three user roles — Tenant, Owner, and Admin. Every private route is protected with a JWT verification middleware, and payments are processed through Stripe.

---

## ✨ Key Features

- 🔐 JWT token generation and verification middleware for API protection
- 🧑‍🤝‍🦽 Role-Based Access Control — Tenant / Owner / Admin permission middleware
- 🏡 Property CRUD API (Create, Update, Delete, Get) with Pending/Approved/Rejected status
- 🔍 Backend-driven search, filter (location, property type, price range), and sorting
- 📄 Pagination (minimum 2 pages supported)
- ❤️ Favorites API (Add/Remove)
- 📅 Booking API — booking creation and status updates (Pending/Approved/Rejected)
- 💳 Stripe Payment Intent creation, with booking + transaction records saved on successful payment
- ⭐ Review & Rating API
- 📊 Owner Analytics API — total earnings, total properties, total bookings, monthly earnings (last 12 months)
- 🛠️ Admin APIs — update user roles, approve/reject properties (with rejection feedback), list bookings & transactions
- 🌐 CORS configured for production deployment

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (jsonwebtoken)
- Stripe (Server SDK)
- Firebase Admin SDK *(for token verification, if used)*

---

## 📦 Key NPM Packages

- `express`
- `mongodb` / `mongoose`
- `cors`
- `dotenv`
- `jsonwebtoken`
- `stripe`
- `firebase-admin` *(if used)*

> ⚠️ Update this list to match your actual `package.json`.

---

## 🔒 Environment Variables (`.env`)

```
PORT=5000
DB_USER=
DB_PASS=
JWT_ACCESS_SECRET=
STRIPE_SECRET_KEY=
```

> ⚠️ Never hardcode MongoDB credentials or your JWT secret — always use a `.env` file and add it to `.gitignore`.

---

## 📂 Main API Routes (Example)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/jwt` | Public | Generate JWT token |
| GET | `/properties` | Public | List approved properties (search/filter/pagination) |
| POST | `/properties` | Owner | Add a new property |
| PATCH | `/properties/:id` | Owner/Admin | Update property / change status |
| DELETE | `/properties/:id` | Owner/Admin | Delete a property |
| POST | `/bookings` | Tenant | Create a new booking |
| PATCH | `/bookings/:id` | Owner | Approve/reject a booking |
| POST | `/create-payment-intent` | Tenant | Create Stripe payment intent |
| GET | `/users` | Admin | Get all users |
| PATCH | `/users/role/:id` | Admin | Change a user's role |
| GET | `/owner-stats` | Owner | Get earnings & booking analytics |

> ⚠️ Update this table to match your actual route structure.

---

## 🚀 Run Locally

```bash
git clone https://github.com/your-username/server-repo.git
cd server-repo
npm install
npm run start
```

---

## 📌 Notes

- When deploying to production, make sure CORS, environment variables, and the MongoDB connection string are configured correctly.
- Verify that no API endpoint throws CORS / 404 / 504 errors.
