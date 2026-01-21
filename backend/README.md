# BHTPA Billing System - Backend

Complete backend system for Bangladesh Hi-Tech Park Authority (BHTPA) billing management with rolling arrears calculation using FIFO principle.

## Features

- **Client Management**: Create, read, update, delete clients
- **Contract Management**: Manage contracts with rate history tracking
- **Rolling Bill System**: Automatic calculation of arrears using FIFO (First-In-First-Out) principle
- **Payment Processing**: Record, approve, and allocate payments to oldest bills first
- **Invoice Generation**: PDF invoices with Bengali (Kalpurush) font support
- **JWT Authentication**: Secure API endpoints with role-based access control
- **Comprehensive API**: RESTful API with validation and error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **PDF Generation**: Puppeteer + Handlebars
- **Validation**: express-validator
- **Security**: Helmet, CORS

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Setup Steps

1. **Clone and Navigate**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your settings:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/bhtpa_billing"
   JWT_SECRET="your-secure-secret-key"
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # (Optional) Seed database
   npm run prisma:seed
   ```

5. **Start Server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

Server will start on `http://localhost:5000`

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── config/
│   │   └── database.js         # Prisma client configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── billController.js   # Bill generation and ledger
│   │   ├── clientController.js # Client CRUD operations
│   │   ├── contractController.js # Contract management
│   │   └── paymentController.js # Payment processing
│   ├── helpers/
│   │   └── handlebarsHelpers.js # Template helper functions
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── errorHandler.js     # Global error handler
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── bills.js            # Bill routes
│   │   ├── clients.js          # Client routes
│   │   ├── contracts.js        # Contract routes
│   │   └── payments.js         # Payment routes
│   ├── services/
│   │   ├── pdfService.js       # PDF invoice generation
│   │   └── rollingBillService.js # Rolling arrears logic
│   ├── templates/
│   │   └── invoice.hbs         # Invoice template
│   └── server.js               # Express app entry point
├── uploads/                    # Generated invoices & uploads
├── .env.example                # Environment variables template
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List all clients (with pagination)
- `POST /api/clients` - Create new client (admin only)
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client (admin only)
- `DELETE /api/clients/:id` - Delete client (admin only)

### Contracts
- `GET /api/contracts` - List contracts (with filters)
- `POST /api/contracts` - Create contract (admin only)
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id` - Update contract (admin only)
- `PUT /api/contracts/:id/rates` - Update contract rates (admin only)
- `GET /api/contracts/:id/rate-history` - Get rate history
- `GET /api/contracts/:id/ledger` - Get contract ledger with arrears

### Bills
- `POST /api/bills/create-month` - Create bill for specific month (admin only)
- `GET /api/bills/ledger/:contractId` - Get complete ledger
- `POST /api/bills/generate-pdf` - Generate invoice PDF

### Payments
- `POST /api/payments` - Record new payment
- `PUT /api/payments/:id/approve` - Approve/reject payment (admin only)
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/contract/:contractId` - Get contract payments

## Rolling Arrears System

### FIFO Principle

The system implements **First-In-First-Out (FIFO)** for payment allocation:

1. **Bill Creation**: Each month, a bill is created with:
   - Rent Amount = Space (sq.ft) × Rent Rate
   - Service Amount = Space (sq.ft) × Service Charge Rate
   - Monthly Total = Rent Amount + Service Amount

2. **Payment Allocation**: When payment is received:
   - System identifies all unpaid/partially paid bills
   - Sorts bills by month (oldest first)
   - Allocates payment to oldest bill first
   - If payment exceeds first bill, moves to next oldest
   - Continues until payment is fully allocated

3. **Bill Status**:
   - `unpaid`: No payment received (paidAmount = 0)
   - `partial`: Partial payment received (0 < paidAmount < monthlyTotal)
   - `paid`: Fully paid (paidAmount = monthlyTotal)

### Example

**Scenario:**
- January Bill: ৳10,000 (Unpaid)
- February Bill: ৳10,000 (Unpaid)
- March Bill: ৳10,000 (Unpaid)
- **Payment Received: ৳25,000**

**Allocation:**
1. ৳10,000 → January (Fully Paid)
2. ৳10,000 → February (Fully Paid)
3. ৳5,000 → March (Partial)

**Result:**
- January: Paid
- February: Paid
- March: Partial (৳5,000 paid, ৳5,000 outstanding)
- **Total Arrears: ৳5,000**

## Database Schema

### Core Models

1. **User**: Authentication and authorization
2. **Client**: Company/tenant information
3. **Contract**: Rental agreements with rates
4. **ContractRateHistory**: Track rate changes over time
5. **BillLedger**: Monthly bill records
6. **Payment**: Payment transactions
7. **BillGenerationLog**: Track invoice generation

### Relationships

```
Client (1) ──→ (Many) Contract
Contract (1) ──→ (Many) BillLedger
Contract (1) ──→ (Many) Payment
BillLedger (1) ──→ (Many) Payment
Contract (1) ──→ (Many) ContractRateHistory
```

## PDF Invoice

Invoices are generated with:
- **Bengali Support**: Kalpurush font for Bengali text
- **Current Month Charges**: Detailed breakdown
- **Previous Arrears**: Rolling arrears table (oldest first)
- **Grand Total**: Current + Arrears
- **Payment Instructions**: Bank details and FIFO notice

PDFs are saved in `/uploads/invoices/` directory.

## Security

- JWT-based authentication
- Bcrypt password hashing (10 rounds)
- Role-based access control (admin/user)
- Helmet.js security headers
- CORS protection
- Input validation with express-validator

## Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)

# Production
npm start                # Start server

# Prisma
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:seed      # Seed database with sample data
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `UPLOAD_DIR` | File upload directory | ./uploads |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 5242880 (5MB) |

## Testing

Use tools like Postman or curl to test the API:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get clients (requires token)
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

All errors return JSON with consistent format:

```json
{
  "error": "Error message",
  "details": { /* Additional details if available */ }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Contributing

1. Follow existing code style
2. Add validation for new endpoints
3. Update documentation for API changes
4. Test thoroughly before committing

## License

MIT License - Bangladesh Hi-Tech Park Authority

## Support

For issues or questions:
- Email: support@bhtpa.gov.bd
- Documentation: [Link to docs]

---

**Built with ❤️ for Bangladesh Hi-Tech Park Authority**
