# 📡 REST API Documentation — ExpenseTracker PRO

Base URL: `http://localhost:5000/api`  
Interactive Swagger UI: `http://localhost:5000/api-docs`

---

## 1. Authentication Endpoints

### Register User
* **Endpoint**: `POST /auth/register`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "Rahul Punjabi",
    "email": "user@example.com",
    "password": "User@123",
    "role": "user",
    "currency": "INR"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful!",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "_id": "6732389148d88...",
      "name": "Rahul Punjabi",
      "email": "user@example.com",
      "role": "user",
      "currency": "INR"
    }
  }
  ```

### Login User
* **Endpoint**: `POST /auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "User@123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { ... }
  }
  ```

### Get Profile
* **Endpoint**: `GET /auth/profile`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**

---

## 2. Transactions & Expenses Endpoints

### List Transactions (with Filtering & Pagination)
* **Endpoint**: `GET /expenses`
* **Query Parameters**:
  * `search`: Search keyword (matches title, category, notes)
  * `type`: `EXPENSE` | `INCOME` | `ALL`
  * `category`: Category name filter
  * `paymentMethod`: `UPI` | `CARD` | `CASH` | `NET_BANKING`
  * `startDate`: `YYYY-MM-DD`
  * `endDate`: `YYYY-MM-DD`
  * `page`: Page number (default: 1)
  * `limit`: Page size (default: 10)
  * `sortBy`: `date` | `amount` | `title`
  * `sortOrder`: `desc` | `asc`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3
    }
  }
  ```

### Aggregate Analytics Summary
* **Endpoint**: `GET /expenses/stats/summary`
* **Access**: Private (Authenticated User)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalIncome": 63500,
        "totalExpense": 21699,
        "netSavings": 41801,
        "savingsRate": 66,
        "totalTransactions": 8
      },
      "categoryBreakdown": [
        { "category": "Housing & Rent", "total": 14000, "percentage": 65 },
        { "category": "Food & Dining", "total": 4700, "percentage": 22 }
      ],
      "monthlyTrends": [ ... ],
      "paymentMethods": [ ... ]
    }
  }
  ```

### Create Transaction
* **Endpoint**: `POST /expenses`
* **Request Body**:
  ```json
  {
    "title": "Grocery Shopping",
    "amount": 2400,
    "type": "EXPENSE",
    "category": "Food & Dining",
    "paymentMethod": "UPI",
    "date": "2026-11-10",
    "notes": "Weekly fruits & vegetables"
  }
  ```
* **Success Response (201 Created)**

### Update Transaction
* **Endpoint**: `PUT /expenses/:id`
* **Success Response (200 OK)**

### Delete Transaction
* **Endpoint**: `DELETE /expenses/:id`
* **Success Response (200 OK)**

---

## 3. Budgets & Thresholds

* `GET /budgets` — List user's monthly budgets with spending progress and threshold status.
* `POST /budgets` — Create or update budget limit for a category.
* `DELETE /budgets/:id` — Delete budget.

---

## 4. Admin Management (RBAC: `role === 'admin'`)

* `GET /admin/users` — Get all registered users and their transaction counts.
* `GET /admin/stats` — System-wide financial metrics and user statistics.
* `PUT /admin/users/:id/role` — Update user role (`user` vs `admin`).
* `PUT /admin/users/:id/status` — Toggle user active/deactivated state.
* `DELETE /admin/users/:id` — Delete user account and associated transactions.

---

## 5. Real-Time WebSockets & Chat

* `GET /chat/messages` — Fetch recent message history.
* `POST /chat/messages` — Post message to chat room.
* **Socket Events**:
  * `expense:added` — Emitted when a transaction is created.
  * `expense:updated` — Emitted when a transaction is edited.
  * `expense:deleted` — Emitted when a transaction is deleted.
  * `budget:alert` — Emitted when user crosses configured category threshold.
  * `chat:message` — Real-time live chat delivery.
  * `users:online` — Live active user counts.
