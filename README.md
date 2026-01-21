# BHTPA Billing System

Complete billing management system for Bangladesh Hi-Tech Park Authority (BHTPA) with rolling arrears calculation using FIFO principle.

## 🏗️ Project Structure

```
BHTPA/
├── backend/          # Backend API (Node.js + Express + Prisma)
│   ├── prisma/       # Database schema and migrations
│   ├── src/          # Source code
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth & error handling
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── templates/    # Invoice templates
│   │   └── server.js     # Express app
│   ├── uploads/      # Generated invoices
│   └── README.md     # Backend documentation
└── README.md         # This file
```

## ✨ Features

### Core Functionality
- **Client Management**: Full CRUD operations for client records
- **Contract Management**: Manage rental contracts with automatic rate history tracking
- **Rolling Bill System**: Automatic monthly bill generation with FIFO arrears calculation
- **Payment Processing**: Record, approve, and automatically allocate payments
- **Invoice Generation**: Professional PDF invoices with Bengali font support
- **Comprehensive API**: RESTful API with authentication and validation

### Rolling Arrears (FIFO Principle)
The system implements **First-In-First-Out (FIFO)** payment allocation:
- Oldest unpaid bills are automatically paid first
- Partial payments are tracked accurately
- Complete audit trail of all transactions
- Automatic arrears calculation and reporting

### Security
- JWT-based authentication
- Role-based access control (Admin/User)
- Password hashing with bcrypt
- Input validation and sanitization
- CORS and security headers

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start server**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`

## 📚 Documentation

- **Backend API**: See [backend/README.md](backend/README.md) for detailed API documentation
- **Database Schema**: See [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

## 🔑 Default Credentials

After seeding the database:
- **Admin**: username: `admin`, password: Set via `ADMIN_DEFAULT_PASSWORD` env var (default: `Admin@BHTPA2026`)
- **User**: username: `user`, password: `user123`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## 📊 API Endpoints

- **Auth**: `/api/auth/*` - Login, logout, user info
- **Clients**: `/api/clients/*` - Client management
- **Contracts**: `/api/contracts/*` - Contract and rate management
- **Bills**: `/api/bills/*` - Bill generation and ledger
- **Payments**: `/api/payments/*` - Payment processing

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **PDF Generation**: Puppeteer + Handlebars
- **Validation**: express-validator

## 📝 License

MIT License - Bangladesh Hi-Tech Park Authority