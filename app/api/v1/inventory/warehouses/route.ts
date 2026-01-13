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

// Validation schema for creating warehouse
const warehouseSchema = z.object({
  code: z.string().min(1, 'كود المخزن مطلوب'),
  nameAr: z.string().min(1, 'اسم المخزن بالعربية مطلوب'),
  nameEn: z.string().min(1, 'اسم المخزن بالإنجليزية مطلوب'),
  address: z.string().optional(),
  managerId: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// GET - List warehouses
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          _count: {
            select: {
              stockLevels: true,
              stockMovements: true,
            },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.warehouse.count({ where }),
    ]);

    return successResponse({
      warehouses,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return serverErrorResponse();
  }
}

// POST - Create warehouse
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = warehouseSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if code already exists
    const existingCode = await prisma.warehouse.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingCode) {
      return badRequestResponse('كود المخزن موجود بالفعل');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        ...data,
        managerId: data.managerId || null,
      },
    });

    return createdResponse(warehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return serverErrorResponse();
  }
}
