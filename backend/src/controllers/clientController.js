const prisma = require('../config/database');
const { validationResult } = require('express-validator');

const listClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          contracts: {
            select: {
              id: true,
              contractNumber: true,
              status: true
            }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      clients,
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

const createClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyName, contactPerson, email, phone, address } = req.body;

    const client = await prisma.client.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        address
      }
    });

    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    next(error);
  }
};

const getClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            billLedgers: {
              where: {
                paymentStatus: {
                  in: ['unpaid', 'partial']
                }
              }
            }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyName, contactPerson, email, phone, address } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        address
      }
    });

    res.json({
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listClients,
  createClient,
  getClient,
  updateClient,
  deleteClient
};
