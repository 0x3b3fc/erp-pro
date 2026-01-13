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
  getCurrentFiscalYear,
} from '@/lib/api/utils';
import { z } from 'zod';

// Validation schema for purchase bill line
const purchaseBillLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'الوصف مطلوب'),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  unitPrice: z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر'),
  taxRate: z.number().min(0).max(100).default(14),
  warehouseId: z.string().optional(),
});

// Validation schema for creating purchase bill
const purchaseBillSchema = z.object({
  supplierId: z.string().min(1, 'المورد مطلوب'),
  purchaseOrderId: z.string().optional(),
  supplierInvoiceNo: z.string().optional(),
  date: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(purchaseBillLineSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
});

// GET - List purchase bills
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
        { billNumber: { contains: search, mode: 'insensitive' } },
        { supplierInvoiceNo: { contains: search, mode: 'insensitive' } },
        { supplier: { nameAr: { contains: search, mode: 'insensitive' } } },
        { supplier: { nameEn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bills, total] = await Promise.all([
      prisma.purchaseBill.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, code: true, nameAr: true, nameEn: true, taxNumber: true },
          },
          purchaseOrder: {
            select: { id: true, poNumber: true },
          },
          lines: {
            include: {
              product: {
                select: { id: true, sku: true, nameAr: true, nameEn: true },
              },
            },
          },
          _count: {
            select: { lines: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseBill.count({ where }),
    ]);

    return successResponse({
      bills,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching purchase bills:', error);
    return serverErrorResponse();
  }
}

// POST - Create purchase bill
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = purchaseBillSchema.safeParse(body);

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

    // Verify purchase order if provided
    if (data.purchaseOrderId) {
      const po = await prisma.purchaseOrder.findFirst({
        where: { id: data.purchaseOrderId, tenantId },
      });

      if (!po) {
        return badRequestResponse('أمر الشراء غير موجود');
      }
    }

    // Verify products and warehouses if provided
    const productIds = data.lines.filter((l) => l.productId).map((l) => l.productId!);
    const warehouseIds = data.lines.filter((l) => l.warehouseId).map((l) => l.warehouseId!);

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });

      if (products.length !== productIds.length) {
        return badRequestResponse('بعض المنتجات غير موجودة');
      }
    }

    if (warehouseIds.length > 0) {
      const warehouses = await prisma.warehouse.findMany({
        where: { id: { in: warehouseIds }, tenantId },
      });

      if (warehouses.length !== warehouseIds.length) {
        return badRequestResponse('بعض المخازن غير موجودة');
      }
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
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        taxAmount: lineVat,
        total: lineTotal,
        warehouseId: line.warehouseId,
      };
    });

    const total = subtotal + totalVat;

    // Generate bill number
    const currentYear = new Date().getFullYear();
    const lastBill = await prisma.purchaseBill.findFirst({
      where: {
        tenantId,
        billNumber: { startsWith: `BILL-${currentYear}` },
      },
      orderBy: { billNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastBill?.billNumber) {
      const match = lastBill.billNumber.match(/BILL-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const billNumber = `BILL-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

    // Create purchase bill with lines
    const bill = await prisma.purchaseBill.create({
      data: {
        tenantId,
        billNumber,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        supplierInvoiceNo: data.supplierInvoiceNo,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(data.date),
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
        purchaseOrder: {
          select: { id: true, poNumber: true },
        },
        lines: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true, nameEn: true },
            },
          },
        },
      },
    });

    return createdResponse(bill);
  } catch (error) {
    console.error('Error creating purchase bill:', error);
    return serverErrorResponse();
  }
}
