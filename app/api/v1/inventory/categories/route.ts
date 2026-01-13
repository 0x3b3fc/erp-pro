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

// Validation schema for creating category
const categorySchema = z.object({
  code: z.string().min(1, 'كود التصنيف مطلوب'),
  nameAr: z.string().min(1, 'اسم التصنيف بالعربية مطلوب'),
  nameEn: z.string().min(1, 'اسم التصنيف بالإنجليزية مطلوب'),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - List categories
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const parentId = searchParams.get('parentId');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        include: {
          parent: {
            select: { id: true, nameAr: true, nameEn: true },
          },
          children: {
            select: { id: true, nameAr: true, nameEn: true },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: { nameAr: 'asc' },
        skip,
        take: limit,
      }),
      prisma.productCategory.count({ where }),
    ]);

    return successResponse({
      categories,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return serverErrorResponse();
  }
}

// POST - Create category
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Verify parent exists if provided
    if (data.parentId) {
      const parent = await prisma.productCategory.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parent) {
        return badRequestResponse('التصنيف الرئيسي غير موجود');
      }
    }

    const category = await prisma.productCategory.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        parent: {
          select: { id: true, nameAr: true, nameEn: true },
        },
      },
    });

    return createdResponse(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return serverErrorResponse();
  }
}
