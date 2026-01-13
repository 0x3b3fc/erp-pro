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

// Validation schema for purchase order line
const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, 'المنتج مطلوب'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  unitPrice: z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر'),
  taxRate: z.number().min(0).max(100).default(14),
  warehouseId: z.string().min(1, 'المخزن مطلوب'),
});

// Validation schema for creating purchase order
const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'المورد مطلوب'),
  date: z.string(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
});

// GET - List purchase orders
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (fromDate) {
      where.date = { ...(where.date as object || {}), gte: new Date(fromDate) };
    }

    if (toDate) {
      where.date = { ...(where.date as object || {}), lte: new Date(toDate) };
    }

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { nameAr: { contains: search, mode: 'insensitive' } } },
        { supplier: { nameEn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, code: true, nameAr: true, nameEn: true, taxNumber: true },
          },
          lines: {
            include: {
              product: {
                select: { id: true, sku: true, nameAr: true, nameEn: true },
              },
              warehouse: {
                select: { id: true, code: true, nameAr: true, nameEn: true },
              },
            },
          },
          _count: {
            select: { lines: true, bills: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return successResponse({
      orders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return serverErrorResponse();
  }
}

// POST - Create purchase order
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = purchaseOrderSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, tenantId },
    });

    if (!supplier) {
      return badRequestResponse('المورد غير موجود');
    }

    // Verify all products and warehouses exist
    const productIds = data.lines.map((line) => line.productId);
    const warehouseIds = data.lines.map((line) => line.warehouseId);

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: warehouseIds }, tenantId },
      }),
    ]);

    if (products.length !== productIds.length) {
      return badRequestResponse('بعض المنتجات غير موجودة');
    }

    if (warehouses.length !== warehouseIds.length) {
      return badRequestResponse('بعض المخازن غير موجودة');
    }

    // Calculate totals
    let subtotal = 0;
    let totalVat = 0;

    const processedLines = data.lines.map((line) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineVat = lineSubtotal * (line.taxRate / 100);
      const lineTotal = lineSubtotal + lineVat;

      subtotal += lineSubtotal;
      totalVat += lineVat;

      return {
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        receivedQty: 0,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        total: lineTotal,
        warehouseId: line.warehouseId,
      };
    });

    const total = subtotal + totalVat;

    // Generate PO number
    const currentYear = new Date().getFullYear();
    const lastOrder = await prisma.purchaseOrder.findFirst({
      where: {
        tenantId,
        poNumber: { startsWith: `PO-${currentYear}` },
      },
      orderBy: { poNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastOrder?.poNumber) {
      const match = lastOrder.poNumber.match(/PO-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const poNumber = `PO-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

    // Create purchase order with lines
    const order = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        poNumber,
        supplierId: data.supplierId,
        date: new Date(data.date),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        subtotal,
        vatAmount: totalVat,
        total,
        notes: data.notes,
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: processedLines,
        },
      },
      include: {
        supplier: {
          select: { id: true, code: true, nameAr: true, nameEn: true, taxNumber: true },
        },
        lines: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true, nameEn: true },
            },
            warehouse: {
              select: { id: true, code: true, nameAr: true, nameEn: true },
            },
          },
        },
      },
    });

    return createdResponse(order);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return serverErrorResponse();
  }
}
