const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { auth, adminAuth } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const contractValidation = [
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('contractNumber').notEmpty().withMessage('Contract number is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('spaceInSqft').isFloat({ min: 0 }).withMessage('Space must be a positive number'),
  body('rentRate').isFloat({ min: 0 }).withMessage('Rent rate must be a positive number'),
  body('serviceChargeRate').isFloat({ min: 0 }).withMessage('Service charge rate must be a positive number')
];

router.get('/', auth, contractController.listContracts);
router.post('/', auth, adminAuth, contractValidation, contractController.createContract);
router.get('/:id', auth, contractController.getContract);
router.put('/:id', auth, adminAuth, contractController.updateContract);
router.put('/:id/rates', auth, adminAuth, contractController.updateRates);
router.get('/:id/rate-history', auth, contractController.getRateHistory);
router.get('/:id/ledger', auth, contractController.getLedger);

module.exports = router;
