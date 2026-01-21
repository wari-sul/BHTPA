const prisma = require('../config/database');

/**
 * Calculate rolling arrears for a contract following FIFO principle
 * Returns array of unpaid/partial bills sorted by billMonth (oldest first)
 * with rolling total calculation for "বকেয়া বিল" column
 */
async function calculateRollingArrears(contractId) {
  const unpaidBills = await prisma.billLedger.findMany({
    where: {
      contractId,
      paymentStatus: {
        in: ['unpaid', 'partial']
      }
    },
    orderBy: {
      billMonth: 'asc' // Oldest first (FIFO)
    }
  });

  let runningTotal = 0; // This is the key for rolling calculation

  return unpaidBills.map(bill => {
    const remainingAmount = bill.monthlyTotal - bill.paidAmount;
    runningTotal += remainingAmount; // Add to running total

    return {
      id: bill.id,
      billMonth: bill.billMonth,
      rentAmount: bill.rentAmount,
      serviceAmount: bill.serviceAmount,
      monthlyTotal: bill.monthlyTotal,
      paidAmount: bill.paidAmount,
      remainingAmount: remainingAmount,
      rollingDue: runningTotal // This goes to "বকেয়া বিল" column
    };
  });
}

/**
 * Allocate payment to bills following FIFO principle
 * Oldest unpaid bills get paid first
 */
async function allocatePayment(contractId, paymentAmount, paymentId) {
  const arrearsBreakdown = await calculateRollingArrears(contractId);
  let remainingPayment = paymentAmount;
  const allocations = [];

  for (const bill of arrearsBreakdown) {
    if (remainingPayment <= 0) break;

    const amountToAllocate = Math.min(remainingPayment, bill.remainingAmount);
    const newPaidAmount = bill.paidAmount + amountToAllocate;
    const newPaymentStatus = 
      newPaidAmount >= bill.monthlyTotal ? 'paid' : 
      newPaidAmount > 0 ? 'partial' : 'unpaid';

    // Update the bill ledger
    await prisma.billLedger.update({
      where: { id: bill.id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus
      }
    });

    // Link payment to bill ledger
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { billLedgerId: bill.id }
      });
    }

    allocations.push({
      billId: bill.id,
      billMonth: bill.billMonth,
      allocated: amountToAllocate,
      previousPaid: bill.paidAmount,
      newPaid: newPaidAmount,
      status: newPaymentStatus
    });

    remainingPayment -= amountToAllocate;
  }

  return {
    allocations,
    fullyAllocated: remainingPayment === 0,
    excessAmount: remainingPayment > 0 ? remainingPayment : 0
  };
}

/**
 * Get complete ledger view with rolling arrears
 */
async function getContractLedger(contractId) {
  const bills = await prisma.billLedger.findMany({
    where: { contractId },
    orderBy: { billMonth: 'asc' }
  });

  const payments = await prisma.payment.findMany({
    where: { 
      contractId,
      status: 'approved'
    },
    orderBy: { paymentDate: 'asc' }
  });

  const arrears = await calculateRollingArrears(contractId);
  const totalArrears = arrears.reduce((sum, bill) => sum + bill.remainingAmount, 0);

  return {
    bills,
    payments,
    arrears,
    totalArrears,
    summary: {
      totalBilled: bills.reduce((sum, bill) => sum + bill.monthlyTotal, 0),
      totalPaid: bills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      totalOutstanding: totalArrears
    }
  };
}

/**
 * Create bill for a specific month
 */
async function createMonthlyBill(contractId, billMonth) {
  // Check if bill already exists
  const existing = await prisma.billLedger.findUnique({
    where: {
      contractId_billMonth: {
        contractId,
        billMonth
      }
    }
  });

  if (existing) {
    throw new Error(`Bill for ${billMonth} already exists`);
  }

  // Get contract details
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { client: true }
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (contract.status !== 'active') {
    throw new Error('Contract is not active');
  }

  // Calculate amounts
  const rentAmount = contract.spaceInSqft * contract.rentRate;
  const serviceAmount = contract.spaceInSqft * contract.serviceChargeRate;
  const monthlyTotal = rentAmount + serviceAmount;

  // Create bill
  const bill = await prisma.billLedger.create({
    data: {
      contractId,
      billMonth,
      rentAmount,
      serviceAmount,
      monthlyTotal,
      paidAmount: 0,
      paymentStatus: 'unpaid'
    }
  });

  return bill;
}

module.exports = {
  calculateRollingArrears,
  allocatePayment,
  getContractLedger,
  createMonthlyBill
};
