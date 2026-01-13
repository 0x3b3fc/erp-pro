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

// Validation schema for creating supplier
const supplierSchema = z.object({
  code: z.string().min(1, 'كود المورد مطلوب'),
  nameAr: z.string().min(1, 'اسم المورد بالعربية مطلوب'),
  nameEn: z.string().min(1, 'اسم المورد بالإنجليزية مطلوب'),
  taxNumber: z.string().optional(),
  commercialReg: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  paymentTerms: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET - List suppliers
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
        { taxNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return successResponse({
      suppliers,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return serverErrorResponse();
  }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = supplierSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if code already exists
    const existingCode = await prisma.supplier.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingCode) {
      return badRequestResponse('كود المورد موجود بالفعل');
    }

    // Check if tax number already exists (if provided)
    if (data.taxNumber) {
      const existingTax = await prisma.supplier.findFirst({
        where: { tenantId, taxNumber: data.taxNumber },
      });

      if (existingTax) {
        return badRequestResponse('الرقم الضريبي موجود بالفعل');
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        ...data,
        email: data.email || null,
      },
    });

    return createdResponse(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return serverErrorResponse();
  }
}
