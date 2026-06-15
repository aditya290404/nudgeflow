import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];
const CATEGORIES = ['Kurta', 'Saree', 'Jeans', 'Sneakers', 'Accessories', 'Skincare', 'Makeup'];
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Aarush', 'Rudra', 'Kabir', 'Saanvi', 'Aadya', 'Kiara', 'Diya', 'Pihu', 'Prisha', 'Ananya', 'Myra', 'Kriti', 'Navya', 'Avni', 'Riya', 'Sara', 'Aalia', 'Mahika'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Joshi', 'Reddy', 'Nair', 'Bose', 'Das', 'Roy', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Deshmukh', 'Kulkarni', 'Jain', 'Agarwal', 'Garg', 'Bansal'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function main() {
  console.log('Seeding database...');
  
  // Clear existing data
  await prisma.communication.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 300; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const numOrders = getRandomInt(2, 8);
    const createdAtDate = getRandomDate(new Date('2023-01-01'), now);
    
    const customer = await prisma.customer.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+91${getRandomInt(9000000000, 9999999999)}`,
        city: getRandomElement(INDIAN_CITIES),
        createdAt: createdAtDate,
      }
    });

    let totalSpend = 0;
    let lastOrderDate: Date | null = null;

    for (let j = 0; j < numOrders; j++) {
      // Ensure order date is after customer creation date
      const orderDate = getRandomDate(createdAtDate, now);
      if (!lastOrderDate || orderDate > lastOrderDate) {
        lastOrderDate = orderDate;
      }
      
      const amount = getRandomInt(500, 15000);
      totalSpend += amount;

      await prisma.order.create({
        data: {
          customerId: customer.id,
          amount,
          category: getRandomElement(CATEGORIES),
          createdAt: orderDate,
        }
      });
    }

    const tags: string[] = [];
    if (totalSpend > 20000) tags.push('vip');
    if (lastOrderDate && lastOrderDate < ninetyDaysAgo) tags.push('at_risk');
    if (createdAtDate > thirtyDaysAgo) tags.push('new');

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOrders: numOrders,
        totalSpend,
        lastOrderDate,
        tags,
      }
    });
  }

  console.log('Database seeded with 300 customers and their orders.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
