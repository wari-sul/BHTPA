const prisma = require('../config/database');
const { createMonthlyBill } = require('../services/rollingBillService');
const { generateInvoicePDF } = require('../services/pdfService');

const createMonth = async (req, res, next) => {
  try {
    const { contractId, billMonth } = req.body;

    if (!contractId || !billMonth) {
      return res.status(400).json({
        error: 'contractId and billMonth are required'
      });
    }

    // Validate billMonth format (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(billMonth)) {
      return res.status(400).json({
        error: 'billMonth must be in YYYY-MM format'
      });
    }

    const bill = await createMonthlyBill(contractId, billMonth);

    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    next(error);
  }
};

const getLedger = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { getContractLedger } = require('../services/rollingBillService');

    const ledger = await getContractLedger(contractId);

    res.json({ ledger });
  } catch (error) {
    next(error);
  }
};

const generatePDF = async (req, res, next) => {
  try {
    const { contractId, billMonth } = req.body;

    if (!contractId || !billMonth) {
      return res.status(400).json({
        error: 'contractId and billMonth are required'
      });
    }

    const result = await generateInvoicePDF(contractId, billMonth, req.user.id);

    res.json({
      message: 'Invoice PDF generated successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMonth,
  getLedger,
  generatePDF
};
