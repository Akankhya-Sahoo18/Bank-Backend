# Bank Transaction Backend

A backend banking application built using **Node.js, Express.js, and MongoDB**. The application provides user authentication, bank account management, secure money transfers, double-entry ledger management, email notifications, and system-user controlled initial fund creation.

The project focuses on maintaining **transaction consistency, authentication security, and accurate account balances** using MongoDB transactions and ledger entries.

---

## Tech Stack

* **Node.js** – JavaScript runtime
* **Express.js** – Backend framework
* **MongoDB** – Database
* **Mongoose** – MongoDB ODM
* **JWT** – Authentication
* **bcrypt** – Password hashing
* **Nodemailer** – Email notifications
* **dotenv** – Environment variable management
* **cookie-parser** – Cookie handling
* **Postman** – API testing

---

## Features

* User registration, login, and logout
* JWT-based authentication using cookies
* Secure password hashing with bcrypt
* JWT token blacklisting during logout
* User account creation
* Account balance calculation
* Money transfers between accounts
* Double-entry ledger system
* MongoDB transactions using Mongoose sessions
* Idempotency key support to prevent duplicate transactions
* Transaction status tracking
* System-user-only initial fund creation
* Registration and transaction email notifications
* Separate authentication middleware for normal and system users
* Protection against modification of ledger records

---

## Project Structure

bank-transaction/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   │
│   ├── middleware/
│   │   └── auth.middleware.js
│   │
│   ├── models/
│   │   ├── account.model.js
│   │   ├── blacklist.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   │
│   ├── routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   │
│   ├── services/
│   │   └── email.service.js
│   │
│   └── app.js
│
├── server.js
├── .env
├── .gitignore
├── package.json
└── package-lock.json

---

## Architecture

The application follows a layered structure:

Client
   ↓
Routes
   ↓
Authentication Middleware
   ↓
Controllers
   ↓
Models / Services
   ↓
MongoDB / Email Service


* **Routes** handle API endpoints.
* **Middleware** handles authentication and authorization.
* **Controllers** contain the main business logic.
* **Models** define database schemas and database-related operations.
* **Services** contain reusable functionality such as sending emails.
* **Config** contains database connection logic.

`server.js` loads environment variables, connects to MongoDB, and starts the server. `app.js` creates the Express application, configures middleware, and registers the application routes.

---

# Authentication

The application uses **JWT authentication with cookies**.

### Registration

During registration:

1. User provides name, email, and password.
2. Password is hashed using bcrypt.
3. User is stored in MongoDB.
4. JWT token is generated.
5. Token is stored in a cookie.
6. Registration email is sent.

### Login

During login, the user's password is validated using the password comparison method defined in the user model. After successful authentication, a JWT is generated and stored in a cookie.

### Logout

During logout, the JWT is added to the blacklist collection and the authentication cookie is cleared.

The authentication middleware checks whether the token is valid and whether it has been blacklisted before allowing access to protected routes.

---

# Database Models

### User

Stores user information such as:

email
name
password
systemUser


Passwords are hashed using bcrypt. The password and `systemUser` fields are excluded from normal queries where appropriate.

### Account

Stores:

user
status
currency

Account status can be:

* `Active`
* `Frozen`
* `Closed`

The account balance is calculated from ledger entries.

### Transaction

Stores:

fromAccount
toAccount
status
amount
idempotencyKey


Transaction status can be:

* `pending`
* `completed`
* `failed`
* `reversed`

### Ledger

Stores individual financial entries:

account
amount
transaction
type


The type can be `credit` or `debit`.

Ledger records are protected from modification to preserve the integrity of financial records.

### Blacklist

Stores blacklisted JWT tokens with an expiration period. This is used to invalidate tokens after logout.

---

# Transaction System

The application uses a **double-entry ledger system**.

For example, if Account A transfers ₹1,000 to Account B:

Account A → Debit  ₹1,000
Account B → Credit ₹1,000


The account balance is calculated using the ledger:

Balance = Total Credits - Total Debits

## MongoDB Transactions

Creating a transaction involves multiple database operations:

1. Create the transaction record.
2. Create the debit ledger entry.
3. Create the credit ledger entry.
4. Commit the database transaction.

These operations are performed using a **Mongoose session**.

If an operation fails, the database transaction can be rolled back, preventing situations such as a debit being recorded without the corresponding credit.

---

# Idempotency

Transactions use an **idempotency key** to prevent accidental duplicate processing.

If the same request is sent multiple times with the same idempotency key, the application can identify it as an already processed request instead of creating another transaction.

This is particularly important for financial operations where duplicate requests could result in incorrect balances.

---

# Initial Funds

The application provides a separate API for creating initial funds.

Unlike normal transactions, this operation can only be performed by a **system user**.

A separate authentication middleware verifies the JWT and confirms that the authenticated user has system-user privileges before allowing the request.

---

# Email Notifications

The application uses **Nodemailer** through a dedicated email service.

Emails are sent for:

* Successful user registration
* Successful transactions
* Failed transactions

Keeping email functionality inside `email.service.js` separates notification logic from the controllers.

---

# API Endpoints

## Authentication

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| POST   | `/auth/register` | Register a new user |
| POST   | `/auth/login`    | Login               |
| POST   | `/auth/logout`   | Logout              |

## Accounts

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/accounts`         | Create an account   |
| GET    | `/accounts`         | Get user's accounts |
| GET    | `/accounts/balance` | Get account balance |

## Transactions

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| POST   | `/transactions`               | Create a transaction |
| POST   | `/transactions/initial-funds` | Create initial funds |

> The exact URL may depend on how the routers are mounted in `app.js`.

---

# Environment Variables

Create a `.env` file in the root directory:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
REFRESH_TOKEN=your_refresh_token
EMAIL_USER=your_email


| Variable        | Purpose                          |
| --------------- | -------------------------------- |
| `MONGO_URI`     | MongoDB connection string        |
| `JWT_SECRET`    | JWT signing and verification     |
| `CLIENT_ID`     | Email/OAuth configuration        |
| `CLIENT_SECRET` | Email/OAuth configuration        |
| `REFRESH_TOKEN` | Email/OAuth configuration        |
| `EMAIL_USER`    | Email account used by Nodemailer |

`.env` and `node_modules` are included in `.gitignore` and should not be committed to the repository.

---

# Installation & Setup

### 1. Clone the repository

git clone https://github.com/Akankhya-Sahoo18/Bank-Backend
cd Bank-Backend

### 2. Install dependencies

npm install


### 3. Configure environment variables

Create `.env` and add the required values.

### 4. Start the application

npm run dev

or use the appropriate start script defined in `package.json`.

The server connects to MongoDB before starting the application.

---

# Testing

The APIs have been tested using **Postman**.

The following flows have been tested:

* User registration
* User login and logout
* Account creation
* Fetching user accounts
* Balance calculation
* Normal transactions
* Initial fund transactions
* Authentication and authorization
* Invalid/blacklisted tokens
* Transaction failure scenarios

---

