const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, paymentController.recordPayment);
router.put('/:id/approve', auth, adminAuth, paymentController.approvePayment);
router.get('/:id', auth, paymentController.getPayment);
router.get('/contract/:contractId', auth, paymentController.getContractPayments);

module.exports = router;
