const prisma = require('../config/database');
const { validationResult } = require('express-validator');

const listContracts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, clientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              companyName: true,
              contactPerson: true,
              email: true
            }
          },
          billLedgers: {
            where: {
              paymentStatus: {
                in: ['unpaid', 'partial']
              }
            },
            select: {
              billMonth: true,
              monthlyTotal: true,
              paidAmount: true
            }
          }
        }
      }),
      prisma.contract.count({ where })
    ]);

    res.json({
      contracts,
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

const createContract = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      contractNumber,
      startDate,
      endDate,
      spaceInSqft,
      rentRate,
      serviceChargeRate,
      status
    } = req.body;

    const contract = await prisma.contract.create({
      data: {
        clientId,
        contractNumber,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        spaceInSqft: parseFloat(spaceInSqft),
        rentRate: parseFloat(rentRate),
        serviceChargeRate: parseFloat(serviceChargeRate),
        status: status || 'active'
      },
      include: {
        client: true
      }
    });

    // Create initial rate history
    await prisma.contractRateHistory.create({
      data: {
        contractId: contract.id,
        rentRate: contract.rentRate,
        serviceChargeRate: contract.serviceChargeRate,
        effectiveDate: contract.startDate
      }
    });

    res.status(201).json({
      message: 'Contract created successfully',
      contract
    });
  } catch (error) {
    next(error);
  }
};

const getContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        rateHistory: {
          orderBy: { effectiveDate: 'desc' }
        },
        billLedgers: {
          orderBy: { billMonth: 'desc' },
          take: 12
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ contract });
  } catch (error) {
    next(error);
  }
};

const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      contractNumber,
      startDate,
      endDate,
      spaceInSqft,
      status
    } = req.body;

    const data = {};
    if (contractNumber) data.contractNumber = contractNumber;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (spaceInSqft) data.spaceInSqft = parseFloat(spaceInSqft);
    if (status) data.status = status;

    const contract = await prisma.contract.update({
      where: { id },
      data,
      include: { client: true }
    });

    res.json({
      message: 'Contract updated successfully',
      contract
    });
  } catch (error) {
    next(error);
  }
};

const updateRates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rentRate, serviceChargeRate, effectiveDate } = req.body;

    if (!rentRate || !serviceChargeRate || !effectiveDate) {
      return res.status(400).json({
        error: 'rentRate, serviceChargeRate, and effectiveDate are required'
      });
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        rentRate: parseFloat(rentRate),
        serviceChargeRate: parseFloat(serviceChargeRate)
      }
    });

    // Create rate history entry
    await prisma.contractRateHistory.create({
      data: {
        contractId: id,
        rentRate: parseFloat(rentRate),
        serviceChargeRate: parseFloat(serviceChargeRate),
        effectiveDate: new Date(effectiveDate)
      }
    });

    res.json({
      message: 'Rates updated successfully',
      contract
    });
  } catch (error) {
    next(error);
  }
};

const getRateHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await prisma.contractRateHistory.findMany({
      where: { contractId: id },
      orderBy: { effectiveDate: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
};

const getLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { getContractLedger } = require('../services/rollingBillService');

    const ledger = await getContractLedger(id);

    res.json({ ledger });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listContracts,
  createContract,
  getContract,
  updateContract,
  updateRates,
  getRateHistory,
  getLedger
};
