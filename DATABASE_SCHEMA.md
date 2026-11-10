# 🗄️ Database Schema & Architecture Documentation

This document describes the MongoDB database design, Mongoose models, validation rules, relationship handling, indexing strategies, and aggregation pipelines implemented in **ExpenseTracker PRO**.

---

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ EXPENSE : "creates / owns"
    USER ||--o{ BUDGET : "configures"
    USER ||--o{ CATEGORY : "defines custom"
    USER ||--o{ MESSAGE : "broadcasts"

    USER {
        ObjectId _id PK
        string name "Required, max 50 chars"
        string email "Unique, indexed, regex validated"
        string password "Hashed with bcrypt (salt 10), hidden by default"
        string role "enum: ['user', 'admin']"
        string currency "default: 'INR'"
        boolean isActive "default: true"
        Date createdAt
        Date updatedAt
    }

    EXPENSE {
        ObjectId _id PK
        ObjectId user FK "Indexed ref to USER"
        string title "max 120 chars, trimmed"
        number amount "min: 0.01"
        string type "enum: ['EXPENSE', 'INCOME']"
        string category "Indexed category name"
        ObjectId categoryRef FK "Optional ref to CATEGORY"
        string paymentMethod "enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER']"
        Date date "Indexed transaction date"
        string notes "max 500 chars"
        string[] tags
        Date createdAt
        Date updatedAt
    }

    BUDGET {
        ObjectId _id PK
        ObjectId user FK "Ref to USER"
        string category "Target category"
        number limit "min: 1"
        number month "1 to 12"
        number year "e.g. 2026"
        number alertThreshold "default: 80%"
        Date createdAt
    }

    CATEGORY {
        ObjectId _id PK
        ObjectId user FK "Null for system defaults, ObjectId for custom"
        string name "Category label"
        string type "enum: ['EXPENSE', 'INCOME']"
        string color "Hex code"
        string icon "Lucide icon identifier"
        boolean isDefault "true for global categories"
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId sender FK "Ref to USER"
        string senderName
        string senderRole "enum: ['user', 'admin']"
        string room "default: 'general'"
        string message "max 1000 chars"
        Date createdAt
    }
```

---

## 2. Model Specifications & Validation Rules

### A. User Model (`server/src/models/User.js`)
* **Email Validation**: Enforced via regex: `/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/`
* **Password Hashing**: Pre-save hook using `bcryptjs` with salt round factor 10. `select: false` protects the hash from leaking into query responses.
* **Role-Based Access**: Role field is constrained to `['user', 'admin']` with default `'user'`.

### B. Expense Model (`server/src/models/Expense.js`)
* **Numeric Boundary Validation**: `min: [0.01, 'Amount must be greater than zero']`
* **Compound Indexes**:
  1. `{ user: 1, date: -1 }`: Optimizes user transaction history lookups and date range sorting.
  2. `{ user: 1, type: 1, date: -1 }`: Accelerates income vs. expense filtering.
  3. `{ user: 1, category: 1 }`: Optimizes category aggregation queries.

### C. Budget Model (`server/src/models/Budget.js`)
* **Uniqueness Index**: `{ user: 1, category: 1, month: 1, year: 1 }` with `{ unique: true }`. Prevents duplicate budget definitions for the same category in the same month.
* **Threshold Alert**: Default trigger at `80%` spend.

---

## 3. Aggregation Pipelines & Query Optimization

### Cash Flow Analytics Pipeline
```javascript
const totals = await Expense.aggregate([
  { $match: { user: userId } },
  {
    $group: {
      _id: '$type',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
]);
```

### Category Breakdown Pipeline
```javascript
const categoryBreakdown = await Expense.aggregate([
  { $match: { user: userId, type: 'EXPENSE' } },
  {
    $group: {
      _id: '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
  { $sort: { total: -1 } },
]);
```
