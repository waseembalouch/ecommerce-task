import { prisma } from '../config/database';

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    lowStockProducts,
    topSellingProducts,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Total products
    prisma.product.count({ where: { isActive: true } }),

    // Total orders
    prisma.order.count(),

    // Total revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
    }),

    // Recent orders (last 10)
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),

    // Low stock products (stock < 10)
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lt: 10,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
      },
      orderBy: { stock: 'asc' },
      take: 10,
    }),

    // Top selling products
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    }),
  ]);

  // Get product details for top selling
  const productIds = topSellingProducts.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const topProducts = topSellingProducts.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      product,
      totalQuantity: item._sum.quantity,
      totalRevenue: item._sum.total,
    };
  });

  return {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    },
    recentOrders,
    lowStockProducts,
    topSellingProducts: topProducts,
  };
};

export const getSalesStats = async (period: 'week' | 'month' | 'year' = 'month') => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      status: {
        in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
      },
    },
    select: {
      createdAt: true,
      total: true,
      status: true,
    },
  });

  // Group by date
  const salesByDate: Record<string, { total: number; count: number }> = {};

  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = { total: 0, count: 0 };
    }
    salesByDate[date].total += Number(order.total);
    salesByDate[date].count += 1;
  });

  const chartData = Object.entries(salesByDate)
    .map(([date, data]) => ({
      date,
      revenue: data.total,
      orders: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = orders.length;

  // Status breakdown
  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    period,
    startDate,
    endDate: now,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    chartData,
    statusBreakdown,
  };
};

export const getUserStats = async () => {
  const [
    totalUsers,
    customerCount,
    adminCount,
    recentUsers,
    userGrowth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
    }),
  ]);

  // Group user growth by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentGrowth = userGrowth.filter(
    (item) => item.createdAt >= sixMonthsAgo
  );

  const growthByMonth: Record<string, number> = {};
  recentGrowth.forEach((item) => {
    const month = item.createdAt.toISOString().substring(0, 7); // YYYY-MM
    growthByMonth[month] = (growthByMonth[month] || 0) + item._count;
  });

  const growthData = Object.entries(growthByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    summary: {
      totalUsers,
      customerCount,
      adminCount,
    },
    recentUsers,
    growthData,
  };
};

export const getProductStats = async () => {
  const [
    totalProducts,
    activeProducts,
    outOfStockCount,
    categoriesWithCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
    }),
  ]);

  return {
    summary: {
      totalProducts,
      activeProducts,
      outOfStockCount,
    },
    categoriesWithCount,
  };
};
