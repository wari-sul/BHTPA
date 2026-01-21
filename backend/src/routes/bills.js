const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/create-month', auth, adminAuth, billController.createMonth);
router.get('/ledger/:contractId', auth, billController.getLedger);
router.post('/generate-pdf', auth, billController.generatePDF);

module.exports = router;
