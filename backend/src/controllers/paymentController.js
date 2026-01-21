const prisma = require('../config/database');
const { allocatePayment } = require('../services/rollingBillService');

const recordPayment = async (req, res, next) => {
  try {
    const {
      contractId,
      amount,
      paymentDate,
      paymentMethod,
      checkNumber,
      checkImage
    } = req.body;

    if (!contractId || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({
        error: 'contractId, amount, paymentDate, and paymentMethod are required'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        contractId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        checkNumber,
        checkImage,
        status: 'pending'
      }
    });

    res.status(201).json({
      message: 'Payment recorded successfully. Awaiting approval.',
      payment
    });
  } catch (error) {
    next(error);
  }
};

const approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved or rejected

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be either "approved" or "rejected"'
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending payments can be approved or rejected'
      });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });

    // If approved, allocate payment to bills
    if (status === 'approved') {
      const allocation = await allocatePayment(
        payment.contractId,
        payment.amount,
        payment.id
      );

      return res.json({
        message: 'Payment approved and allocated successfully',
        payment: updatedPayment,
        allocation
      });
    }

    res.json({
      message: 'Payment rejected',
      payment: updatedPayment
    });
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            client: true
          }
        },
        billLedger: true,
        approver: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

const getContractPayments = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { contractId };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { paymentDate: 'desc' },
        include: {
          billLedger: {
            select: {
              billMonth: true
            }
          },
          approver: {
            select: {
              username: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  approvePayment,
  getPayment,
  getContractPayments
};
