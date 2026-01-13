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

// Validation schema for creating product
const productSchema = z.object({
  sku: z.string().min(1, 'كود المنتج مطلوب'),
  nameAr: z.string().min(1, 'اسم المنتج بالعربية مطلوب'),
  nameEn: z.string().min(1, 'اسم المنتج بالإنجليزية مطلوب'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().default('PCS'),
  salesPrice: z.number().min(0),
  costPrice: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(14),
  etaItemCode: z.string().optional(),
  etaItemType: z.string().optional(),
  barcode: z.string().optional(),
  reorderPoint: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET - List products
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true },
          },
          stockLevels: {
            select: {
              quantity: true,
              warehouse: {
                select: { id: true, nameAr: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate total stock for each product
    const productsWithStock = products.map((product) => ({
      ...product,
      totalStock: product.stockLevels.reduce(
        (sum, sl) => sum + Number(sl.quantity),
        0
      ),
    }));

    return successResponse({
      products: productsWithStock,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return serverErrorResponse();
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if SKU already exists
    const existingSku = await prisma.product.findFirst({
      where: { tenantId, sku: data.sku },
    });

    if (existingSku) {
      return badRequestResponse('كود المنتج موجود بالفعل');
    }

    // Check if barcode already exists (if provided)
    if (data.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { tenantId, barcode: data.barcode },
      });

      if (existingBarcode) {
        return badRequestResponse('الباركود موجود بالفعل');
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true },
        },
      },
    });

    return createdResponse(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return serverErrorResponse();
  }
}
