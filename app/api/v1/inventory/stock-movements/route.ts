import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  createdResponse,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api/utils';
import { z } from 'zod';

// Validation schema for stock adjustment
const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'المنتج مطلوب'),
  warehouseId: z.string().min(1, 'المخزن مطلوب'),
  quantity: z.number(),
  costPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// GET - List stock movements
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
    const movementType = searchParams.get('movementType');
    const referenceType = searchParams.get('referenceType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (referenceType) {
      where.referenceType = referenceType;
    }

    if (fromDate) {
      where.date = { ...(where.date as object || {}), gte: new Date(fromDate) };
    }

    if (toDate) {
      where.date = { ...(where.date as object || {}), lte: new Date(toDate) };
    }

    if (search) {
      where.OR = [
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { product: { nameAr: { contains: search, mode: 'insensitive' } } },
        { product: { nameEn: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              nameAr: true,
              nameEn: true,
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
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return successResponse({
      movements,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return serverErrorResponse();
  }
}

// POST - Create stock adjustment
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = stockAdjustmentSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Verify product and warehouse exist
    const [product, warehouse] = await Promise.all([
      prisma.product.findFirst({
        where: { id: data.productId, tenantId },
      }),
      prisma.warehouse.findFirst({
        where: { id: data.warehouseId, tenantId },
      }),
    ]);

    if (!product) {
      return badRequestResponse('المنتج غير موجود');
    }

    if (!warehouse) {
      return badRequestResponse('المخزن غير موجود');
    }

    if (!product.trackInventory) {
      return badRequestResponse('هذا المنتج لا يتطلب تتبع المخزون');
    }

    // Get current stock level
    const currentStock = await prisma.stockLevel.findUnique({
      where: {
        productId_warehouseId: {
          productId: data.productId,
          warehouseId: data.warehouseId,
        },
      },
    });

    const currentQty = currentStock ? Number(currentStock.quantity) : 0;
    const newQty = data.quantity;
    const difference = newQty - currentQty;

    if (difference === 0) {
      return badRequestResponse('الكمية الجديدة تساوي الكمية الحالية');
    }

    // Determine movement type
    const movementType = difference > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT';
    // For adjustments, we'll use positive quantity and let the system handle the sign
    const movementQty = Math.abs(difference);
    const costPrice = data.costPrice || (currentStock ? Number(currentStock.avgCost) : Number(product.costPrice));

    // Create adjustment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update or create stock level
      const updatedStock = await tx.stockLevel.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          quantity: newQty,
          // Update avg cost if provided
          ...(data.costPrice && { avgCost: data.costPrice }),
        },
        create: {
          tenantId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: newQty,
          avgCost: costPrice,
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          movementType,
          quantity: movementQty,
          costPrice,
          referenceType: 'ADJUSTMENT',
          referenceId: updatedStock.id, // Reference to stock level
          date: new Date(),
          notes: data.notes || `Stock adjustment: ${currentQty} → ${newQty}`,
          createdBy: userId,
        },
      });

      return { stockLevel: updatedStock, movement };
    });

    return createdResponse(result);
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    return serverErrorResponse();
  }
}
