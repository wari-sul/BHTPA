const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@bhtpa.gov.bd',
      password: hashedPassword,
      role: 'admin'
    }
  });
  console.log('✓ Admin user created:', admin.username);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@bhtpa.gov.bd',
      password: userPassword,
      role: 'user'
    }
  });
  console.log('✓ Regular user created:', user.username);

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { email: 'contact@techcompany.com' },
    update: {},
    create: {
      companyName: 'Tech Innovations Ltd.',
      contactPerson: 'Karim Ahmed',
      email: 'contact@techcompany.com',
      phone: '+880-1711-123456',
      address: 'Plot 123, Gulshan-2, Dhaka-1212'
    }
  });
  console.log('✓ Client created:', client1.companyName);

  const client2 = await prisma.client.upsert({
    where: { email: 'info@softwarebd.com' },
    update: {},
    create: {
      companyName: 'Bangladesh Software Solutions',
      contactPerson: 'Fatima Rahman',
      email: 'info@softwarebd.com',
      phone: '+880-1722-234567',
      address: 'House 45, Road 12, Banani, Dhaka-1213'
    }
  });
  console.log('✓ Client created:', client2.companyName);

  // Create sample contracts
  const contract1 = await prisma.contract.upsert({
    where: { contractNumber: 'BHTPA-2024-001' },
    update: {},
    create: {
      clientId: client1.id,
      contractNumber: 'BHTPA-2024-001',
      startDate: new Date('2024-01-01'),
      spaceInSqft: 1000,
      rentRate: 50,
      serviceChargeRate: 20,
      status: 'active'
    }
  });
  console.log('✓ Contract created:', contract1.contractNumber);

  // Create rate history for contract1
  await prisma.contractRateHistory.create({
    data: {
      contractId: contract1.id,
      rentRate: 50,
      serviceChargeRate: 20,
      effectiveDate: new Date('2024-01-01')
    }
  });

  const contract2 = await prisma.contract.upsert({
    where: { contractNumber: 'BHTPA-2024-002' },
    update: {},
    create: {
      clientId: client2.id,
      contractNumber: 'BHTPA-2024-002',
      startDate: new Date('2024-02-01'),
      spaceInSqft: 1500,
      rentRate: 45,
      serviceChargeRate: 18,
      status: 'active'
    }
  });
  console.log('✓ Contract created:', contract2.contractNumber);

  // Create rate history for contract2
  await prisma.contractRateHistory.create({
    data: {
      contractId: contract2.id,
      rentRate: 45,
      serviceChargeRate: 18,
      effectiveDate: new Date('2024-02-01')
    }
  });

  // Create sample bills for contract1
  const months = ['2024-01', '2024-02', '2024-03'];
  for (const month of months) {
    const rentAmount = contract1.spaceInSqft * contract1.rentRate;
    const serviceAmount = contract1.spaceInSqft * contract1.serviceChargeRate;
    const monthlyTotal = rentAmount + serviceAmount;

    await prisma.billLedger.upsert({
      where: {
        contractId_billMonth: {
          contractId: contract1.id,
          billMonth: month
        }
      },
      update: {},
      create: {
        contractId: contract1.id,
        billMonth: month,
        rentAmount,
        serviceAmount,
        monthlyTotal,
        paidAmount: month === '2024-01' ? monthlyTotal : 0,
        paymentStatus: month === '2024-01' ? 'paid' : 'unpaid'
      }
    });
  }
  console.log('✓ Bills created for contract:', contract1.contractNumber);

  // Create sample bills for contract2
  const months2 = ['2024-02', '2024-03'];
  for (const month of months2) {
    const rentAmount = contract2.spaceInSqft * contract2.rentRate;
    const serviceAmount = contract2.spaceInSqft * contract2.serviceChargeRate;
    const monthlyTotal = rentAmount + serviceAmount;

    await prisma.billLedger.upsert({
      where: {
        contractId_billMonth: {
          contractId: contract2.id,
          billMonth: month
        }
      },
      update: {},
      create: {
        contractId: contract2.id,
        billMonth: month,
        rentAmount,
        serviceAmount,
        monthlyTotal,
        paidAmount: 0,
        paymentStatus: 'unpaid'
      }
    });
  }
  console.log('✓ Bills created for contract:', contract2.contractNumber);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin - Username: admin, Password: admin123');
  console.log('User  - Username: user, Password: user123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
