import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api/utils';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Run all queries in parallel
    const [
      // Invoices stats
      invoicesCount,
      invoicesTotalThisMonth,
      invoicesThisYear,
      invoicesByStatus,
      // Customer stats
      customersCount,
      newCustomersThisMonth,
      // Products stats
      productsCount,
      lowStockProducts,
      // Recent invoices
      recentInvoices,
      // Top customers
      topCustomers,
      // Monthly sales
      monthlySales,
    ] = await Promise.all([
      // Total invoices
      prisma.invoice.count({ where: { tenantId } }),

      // This month's invoices total
      prisma.invoice.aggregate({
        where: {
          tenantId,
          date: { gte: startOfMonth },
          status: { notIn: ['CANCELLED', 'DRAFT'] },
        },
        _sum: { total: true },
      }),

      // This year's invoices total
      prisma.invoice.aggregate({
        where: {
          tenantId,
          date: { gte: startOfYear },
          status: { notIn: ['CANCELLED', 'DRAFT'] },
        },
        _sum: { total: true },
      }),

      // Invoices by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // Total customers
      prisma.customer.count({ where: { tenantId } }),

      // New customers this month
      prisma.customer.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Total products
      prisma.product.count({ where: { tenantId, isActive: true } }),

      // Low stock products (products with reorder point set)
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id
        WHERE p.tenant_id = ${tenantId}
          AND p.is_active = true
          AND p.reorder_point IS NOT NULL
        GROUP BY p.id
        HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      ` as Promise<Array<{ count: bigint }>>,

      // Recent invoices
      prisma.invoice.findMany({
        where: { tenantId },
        include: {
          customer: {
            select: { nameAr: true },
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      // Top customers by revenue
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          status: { notIn: ['CANCELLED', 'DRAFT'] },
          date: { gte: startOfYear },
        },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),

      // Monthly sales for current year
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM date) as month,
          SUM(total::numeric) as total
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status NOT IN ('CANCELLED', 'DRAFT')
          AND date >= ${startOfYear}
        GROUP BY EXTRACT(MONTH FROM date)
        ORDER BY month
      ` as Promise<Array<{ month: number; total: number }>>,
    ]);

    // Get customer names for top customers
    const customerIds = topCustomers.map((c) => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, nameAr: true },
    });

    const topCustomersWithNames = topCustomers.map((c) => ({
      ...c,
      customer: customers.find((cust) => cust.id === c.customerId),
    }));

    // Format response
    const stats = {
      overview: {
        totalInvoices: invoicesCount,
        totalCustomers: customersCount,
        totalProducts: productsCount,
        newCustomersThisMonth,
        lowStockCount: lowStockProducts[0]?.count ? Number(lowStockProducts[0].count) : 0,
      },
      sales: {
        thisMonth: Number(invoicesTotalThisMonth._sum.total) || 0,
        thisYear: Number(invoicesThisYear._sum.total) || 0,
        monthlySales: monthlySales.map((m) => ({
          month: Number(m.month),
          total: Number(m.total),
        })),
      },
      invoicesByStatus: invoicesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        total: Number(inv.total),
        status: inv.status,
        etaStatus: inv.etaStatus,
        customerName: inv.customer.nameAr,
      })),
      topCustomers: topCustomersWithNames.map((c) => ({
        customerId: c.customerId,
        customerName: c.customer?.nameAr || 'غير معروف',
        totalRevenue: Number(c._sum.total),
        invoiceCount: c._count,
      })),
    };

    return successResponse(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return serverErrorResponse();
  }
}
