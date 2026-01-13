import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  successResponse,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api/utils';

// GET - List stock levels
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const lowStock = searchParams.get('lowStock'); // Only show products below reorder point
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { product: { nameAr: { contains: search, mode: 'insensitive' } } },
        { product: { nameEn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [stockLevels, total] = await Promise.all([
      prisma.stockLevel.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              nameAr: true,
              nameEn: true,
              reorderPoint: true,
              reorderQty: true,
              unitOfMeasure: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              code: true,
              nameAr: true,
              nameEn: true,
            },
          },
        },
        orderBy: [
          { warehouse: { code: 'asc' } },
          { product: { sku: 'asc' } },
        ],
        skip,
        take: limit,
      }),
      prisma.stockLevel.count({ where }),
    ]);

    // Filter low stock if requested
    let filteredLevels = stockLevels;
    if (lowStock === 'true') {
      filteredLevels = stockLevels.filter((sl) => {
        const qty = Number(sl.quantity);
        const reorderPoint = Number(sl.product.reorderPoint || 0);
        return qty <= reorderPoint;
      });
    }

    return successResponse({
      stockLevels: filteredLevels,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return serverErrorResponse();
  }
}
