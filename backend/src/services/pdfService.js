const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../config/database');
const { calculateRollingArrears } = require('./rollingBillService');
const { getLogoBase64 } = require('../utils/logoHelper');

// Register Handlebars helpers
require('../helpers/handlebarsHelpers');

/**
 * Generate invoice PDF for a contract
 */
async function generateInvoicePDF(contractId, billMonth, generatedBy) {
  try {
    // Fetch contract with all related data
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        billLedgers: {
          where: { billMonth },
          include: {
            payments: {
              where: { status: 'approved' }
            }
          }
        }
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    const currentBill = contract.billLedgers[0];
    if (!currentBill) {
      throw new Error(`Bill for ${billMonth} not found`);
    }

    // Get rolling arrears
    const arrears = await calculateRollingArrears(contractId);
    const totalArrears = arrears.reduce((sum, bill) => sum + bill.remainingAmount, 0);

    // Load template
    const templatePath = path.join(__dirname, '../templates/invoice.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Prepare data
    const invoiceData = {
      logo: getLogoBase64(),
      invoiceNumber: `INV-${contract.contractNumber}-${billMonth}`,
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      billMonth: billMonth,
      client: {
        companyName: contract.client.companyName,
        contactPerson: contract.client.contactPerson,
        address: contract.client.address,
        phone: contract.client.phone,
        email: contract.client.email
      },
      contract: {
        contractNumber: contract.contractNumber,
        spaceInSqft: contract.spaceInSqft,
        rentRate: contract.rentRate,
        serviceChargeRate: contract.serviceChargeRate
      },
      currentBill: {
        billMonth: currentBill.billMonth,
        rentAmount: currentBill.rentAmount,
        serviceAmount: currentBill.serviceAmount,
        monthlyTotal: currentBill.monthlyTotal,
        paidAmount: currentBill.paidAmount,
        remainingAmount: currentBill.monthlyTotal - currentBill.paidAmount
      },
      arrears: arrears,
      totalArrears: totalArrears,
      grandTotal: totalArrears + (currentBill.monthlyTotal - currentBill.paidAmount)
    };

    const html = template(invoiceData);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/invoices');
    await fs.mkdir(uploadsDir, { recursive: true });

    const pdfFilename = `invoice-${contract.contractNumber}-${billMonth}-${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Log generation
    await prisma.billGenerationLog.create({
      data: {
        contractId,
        billMonth,
        generatedBy,
        pdfPath: `/uploads/invoices/${pdfFilename}`
      }
    });

    return {
      pdfPath: pdfPath,
      publicPath: `/uploads/invoices/${pdfFilename}`,
      filename: pdfFilename
    };
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

module.exports = {
  generateInvoicePDF
};
