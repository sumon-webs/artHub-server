# 🎨 ArtHub Server

Backend API for the **ArtHub** platform — a digital art marketplace where artists can manage and showcase artworks, while buyers can explore and interact with creative content.

🔗 **Client Live URL:** https://arthub-client-ten.vercel.app/

---

## 📌 Project Overview

ArtHub Server is built with **Node.js**, **Express.js**, and **MongoDB**. It provides secure REST APIs for authentication, role-based access control, artwork management, subscription plans, and user management.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure user authentication using JWT.
- Protected API routes.
- Token verification middleware.
- Role-based access control.
- Session validation for authenticated users.

### 👥 User Management
- Create and manage users.
- Update user roles.
- Store user subscription plans.
- Manage artist and buyer profiles.
- Fetch current authenticated user information.

### 🎨 Artwork Management
- Create new artworks.
- Update artwork information.
- Delete artworks.
- Retrieve single artwork details.
- Retrieve all artworks.
- Filter artworks by artist.

### 👨‍🎨 Artist Features
- Artist-specific dashboard APIs.
- Fetch artist's own artworks.
- Track artwork statistics.
- Manage artwork inventory.

### 💳 Subscription System
- Support for multiple plans:
  - Buyer Free
  - Buyer Pro
  - Buyer Premium
- Upgrade user plans.
- Limit features based on subscription.

### 📊 Dashboard APIs
- Artist dashboard statistics.
- Buyer dashboard statistics.
- Total artworks count.
- User-specific analytics.

### 🛡️ Security Features
- JWT authentication.
- Environment variable protection.
- MongoDB ObjectId validation.
- CORS configuration.
- Secure API middleware.
- Error handling and validation.

---

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication & Security
- JSON Web Token (JWT)
- Middleware Authorization
- CORS
- dotenv

### Deployment
- Vercel / Render

---

## 📂 API Functionalities

### User APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get single user |
| PATCH | `/api/users/:id/plan` | Update subscription plan |
| PATCH | `/api/users/:id/role` | Update user role |

---

### Artwork APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/artworks` | Create artwork |
| GET | `/api/artworks` | Get all artworks |
| GET | `/api/artworks/:id` | Get single artwork |
| PATCH | `/api/artworks/:id` | Update artwork |
| DELETE | `/api/artworks/:id` | Delete artwork |

---

### Dashboard APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard/artist` | Artist dashboard stats |
| GET | `/api/dashboard/buyer` | Buyer dashboard stats |

---

## 📁 Project Structure

```bash
├── index.js
├── package.json
├── .env
├── middleware
│   └── verifyToken.js
├── routes
│   ├── userRoutes.js
│   └── artworkRoutes.js
├── controllers
├── utils
└── config
