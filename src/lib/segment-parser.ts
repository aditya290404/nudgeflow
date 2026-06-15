import { Prisma } from '@prisma/client';

export function convertLogicToPrismaWhere(filterLogic: any): Prisma.CustomerWhereInput {
  if (!filterLogic || typeof filterLogic !== 'object') return {};

  const where: Prisma.CustomerWhereInput = {};

  if (filterLogic.totalSpend) {
    where.totalSpend = filterLogic.totalSpend;
  }
  
  if (filterLogic.totalOrders) {
    where.totalOrders = filterLogic.totalOrders;
  }

  if (filterLogic.lastOrderDate) {
    where.lastOrderDate = filterLogic.lastOrderDate;
  }

  if (filterLogic.tags) {
    if (filterLogic.tags.has) {
      where.tags = { has: filterLogic.tags.has };
    }
  }

  if (filterLogic.city) {
    where.city = filterLogic.city;
  }

  return where;
}
