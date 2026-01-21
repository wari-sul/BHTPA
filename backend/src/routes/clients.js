const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { auth, adminAuth } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const clientValidation = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('address').notEmpty().withMessage('Address is required')
];

router.get('/', auth, clientController.listClients);
router.post('/', auth, adminAuth, clientValidation, clientController.createClient);
router.get('/:id', auth, clientController.getClient);
router.put('/:id', auth, adminAuth, clientController.updateClient);
router.delete('/:id', auth, adminAuth, clientController.deleteClient);

module.exports = router;
