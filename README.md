# Java Monolith E-Commerce Platform

A production-grade, full-stack e-commerce monolith built with Spring Boot 3, Java 21, PostgreSQL on Google Cloud SQL, and an embedded React (Vite) Single-Page Application. Deployed automatically via GitHub Actions CI/CD to Google Cloud Run.

---

## Live URL
* **Production Deployment:** https://monolith-java-ecommerce.prasadaraodarla.co.in

---

## System Architecture
[ Web Browser / Client ]
│
▼ HTTPS
[ Google Cloud Run Service ]
├── Embedded React SPA (Served statically at '/')
└── Spring Boot 3 Monolith (REST APIs at '/api/')
│
│ Cloud SQL Auth Proxy / Unix Socket
▼
[ Google Cloud SQL (PostgreSQL 16) ]

---

## Technology Stack

* **Backend:** Java 21, Spring Boot 3.3.3
* **Security:** Spring Security 6, Stateless JWT (HMAC-SHA256), BCrypt Password Encoder
* **Persistence & Database:** Google Cloud SQL (PostgreSQL 16), Spring Data JPA, Hibernate ORM
* **Frontend:** React 18, Vite, Responsive CSS
* **Cloud & DevOps:** Google Cloud Run, Google Artifact Registry, GitHub Actions CI/CD, Multi-Stage Docker

---

## Key Modules & Features

### 1. Identity & Access Management
* **Registration & Login:** Secure authentication with client-side validation and BCrypt hashed credentials.
* **Stateless Authorization:** Custom `JwtAuthenticationFilter` protecting authenticated endpoints.
* **Password Management:** Self-service password change workflow with previous credential checks.
* **System Bootstrap:** Automated initial Admin seeding (`admin@ecommerce.com`) on container startup via `CommandLineRunner` guard patterns.

### 2. Product Catalog
* Full CRUD endpoints for managing store inventory.
* Real-time stock decrementing upon successful purchase.
* Automatic fallback seeding of sample product inventory when empty.

### 3. Shopping Cart Management
* User-isolated persistent cart stored in Cloud SQL.
* Add item with real-time inventory validation.
* Separate dedicated Cart view with subtotal calculations and line-item removal.

### 4. Sandbox Payment Gateway & Orders
* Order creation supporting atomic inventory reduction.
* Embedded mock payment simulation environment:
  * **Success:** Authorizes payment, changes order status to `PAID`, deducts stock, and clears the cart.
  * **Decline:** Simulates declined authorization, records order status as `CANCELLED`, and retains product inventory.
* Persistent payment audit trail stored in the `payments` table.

### 5. Multi-View Single-Page Interface (SPA)
* Dynamic view navigation: Home, Cart, Checkout, Orders, Login, Register.
* Live cart and order summary counters on the home dashboard.
* Active user session status displayed in the header.
* Toast notification banners for order completion and validation errors.

---

## API Documentation

### Public Endpoints
* `POST /api/auth/register` — Register a new customer account
* `POST /api/auth/login` — Authenticate and receive a Bearer JWT
* `GET  /api/v1/products` — Retrieve all catalog items
* `GET  /api/v1/products/{id}` — Retrieve item details by ID

### Authenticated Endpoints (`Authorization: Bearer <TOKEN>`)
* `GET    /api/v1/users/me` — Retrieve active user profile
* `PUT    /api/v1/users/change-password` — Change password
* `GET    /api/v1/cart` — View user shopping cart
* `POST   /api/v1/cart/items` — Add product to cart (`{ productId, quantity }`)
* `DELETE /api/v1/cart/items/{itemId}` — Remove item from cart
* `POST   /api/v1/orders/checkout` — Run checkout (`{ simulation: "SUCCESS" | "FAILED" }`)
* `GET    /api/v1/orders` — Retrieve user purchase history

---

## Deployment & CI/CD Pipeline

Every commit pushed to the `prod` branch automatically executes the following inside GitHub Actions:
1. **Frontend Stage:** Executes `npm run build` inside `frontend/` and deposits assets into Spring Boot's `src/main/resources/static`.
2. **Backend Stage:** Compiles the application and bundles a runnable standalone JAR via `mvn clean package -DskipTests`.
3. **Containerization:** Builds a lightweight Alpine container image with Eclipse Temurin 21 JRE.
4. **Registry Push:** Tags and pushes the image to Google Artifact Registry.
5. **Deployment:** Rolls out a zero-downtime revision to Google Cloud Run.