import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.communication.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log('Generating Customers...');
  const customers = Array.from({ length: 1500 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    city: faker.location.city(),
    totalOrders: 0,
    totalSpend: 0,
    tags: faker.helpers.arrayElements(['VIP', 'Churn Risk', 'New', 'Frequent Buyer', 'Discount Seeker', 'Holiday Shopper'], { min: 0, max: 3 }),
    createdAt: faker.date.past({ years: 2 }),
  }));

  const createdCustomers = await prisma.customer.createManyAndReturn({
    data: customers,
  });

  console.log(`Created ${createdCustomers.length} customers.`);

  console.log('Generating Orders...');
  const orders = [];
  for (const customer of createdCustomers) {
    // Generate between 0 and 10 orders for each customer
    const numOrders = faker.number.int({ min: 0, max: 10 });
    
    let totalSpend = 0;
    let lastOrderDate = customer.createdAt;

    for (let i = 0; i < numOrders; i++) {
      const amount = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
      const orderDate = faker.date.between({ from: customer.createdAt, to: new Date() });
      
      totalSpend += amount;
      if (orderDate > lastOrderDate) {
        lastOrderDate = orderDate;
      }

      orders.push({
        customerId: customer.id,
        amount,
        category: faker.commerce.department(),
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'refunded', 'processing']),
        createdAt: orderDate,
      });
    }

    // Update customer aggregates
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOrders: numOrders,
        totalSpend,
        lastOrderDate: numOrders > 0 ? lastOrderDate : null,
      }
    });
  }

  // Batch insert orders
  console.log(`Inserting ${orders.length} orders...`);
  // Prisma createMany has limits, let's chunk it
  const chunkSize = 1000;
  for (let i = 0; i < orders.length; i += chunkSize) {
    const chunk = orders.slice(i, i + chunkSize);
    await prisma.order.createMany({ data: chunk });
  }
  console.log(`Created ${orders.length} orders.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
