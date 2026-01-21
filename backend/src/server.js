require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const contractRoutes = require('./routes/contracts');
const billRoutes = require('./routes/bills');
const paymentRoutes = require('./routes/payments');
const usersRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded invoices and check images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BHTPA Billing System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   BHTPA Billing System Backend                            ║
║   Server running on port ${PORT}                             ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║   API Endpoints:                                           ║
║   - Health: http://localhost:${PORT}/health                   ║
║   - Auth: http://localhost:${PORT}/api/auth                   ║
║   - Clients: http://localhost:${PORT}/api/clients             ║
║   - Contracts: http://localhost:${PORT}/api/contracts         ║
║   - Bills: http://localhost:${PORT}/api/bills                 ║
║   - Payments: http://localhost:${PORT}/api/payments           ║
║   - Users: http://localhost:${PORT}/api/users                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
