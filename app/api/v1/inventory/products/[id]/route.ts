import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api/utils';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Validation schema for updating product
const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  salesPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  etaItemCode: z.string().optional(),
  etaItemType: z.string().optional(),
  barcode: z.string().optional(),
  reorderPoint: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        stockLevels: {
          include: {
            warehouse: {
              select: { id: true, nameAr: true, nameEn: true },
            },
          },
        },
      },
    });

    if (!product) {
      return notFoundResponse('المنتج غير موجود');
    }

    // Calculate total stock
    const totalStock = product.stockLevels.reduce(
      (sum, sl) => sum + Number(sl.quantity),
      0
    );

    return successResponse({
      ...product,
      totalStock,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return serverErrorResponse();
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      return notFoundResponse('المنتج غير موجود');
    }

    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if SKU already exists (if changing)
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { tenantId, sku: data.sku, id: { not: id } },
      });

      if (existingSku) {
        return badRequestResponse('كود المنتج موجود بالفعل');
      }
    }

    // Check if barcode already exists (if changing)
    if (data.barcode && data.barcode !== product.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { tenantId, barcode: data.barcode, id: { not: id } },
      });

      if (existingBarcode) {
        return badRequestResponse('الباركود موجود بالفعل');
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            invoiceLines: true,
            stockLevels: true,
          },
        },
      },
    });

    if (!product) {
      return notFoundResponse('المنتج غير موجود');
    }

    // Check if product is used in invoices
    if (product._count.invoiceLines > 0) {
      return badRequestResponse('لا يمكن حذف المنتج لوجود فواتير مرتبطة به');
    }

    // Check if product has stock
    if (product._count.stockLevels > 0) {
      // Delete stock levels first
      await prisma.stockLevel.deleteMany({
        where: { productId: id },
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return successResponse({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return serverErrorResponse();
  }
}
