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

// Validation schema for customer
const customerSchema = z.object({
  code: z.string().min(1).max(20),
  nameAr: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('BUSINESS'),
  taxNumber: z.string().optional(),
  commercialRegister: z.string().optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('EG'),
  creditLimit: z.number().min(0).default(0),
  paymentTermsDays: z.number().min(0).default(0),
  accountId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - List customers
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (type) {
      where.customerType = type;
    }

    if (active !== null && active !== undefined) {
      where.isActive = active === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { taxNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return successResponse({
      customers,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return serverErrorResponse();
  }
}

// POST - Create customer
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = customerSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if code already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingCustomer) {
      return badRequestResponse('Customer code already exists');
    }

    // If accountId provided, verify it exists
    if (data.accountId) {
      const account = await prisma.chartOfAccount.findFirst({
        where: { id: data.accountId, tenantId },
      });
      if (!account) {
        return badRequestResponse('Account not found');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        ...data,
      },
    });

    return createdResponse(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return serverErrorResponse();
  }
}
