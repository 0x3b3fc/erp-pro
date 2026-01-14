import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Validation schema
const tenantSchema = z.object({
  name: z.string().min(1, 'اسم الشركة مطلوب'),
  subdomain: z.string().min(1, 'النطاق الفرعي مطلوب').regex(/^[a-z0-9-]+$/, 'النطاق الفرعي يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط'),
  planType: z.enum(['STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE']).default('STARTER'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).default('ACTIVE'),
  // Company info
  companyNameAr: z.string().min(1, 'اسم الشركة بالعربية مطلوب'),
  companyNameEn: z.string().min(1, 'اسم الشركة بالإنجليزية مطلوب'),
  taxNumber: z.string().optional(),
  commercialRegNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صحيح').optional(),
  // Admin user
  adminEmail: z.string().email('بريد إلكتروني غير صحيح'),
  adminPassword: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  adminNameAr: z.string().min(1, 'اسم المدير بالعربية مطلوب'),
  adminNameEn: z.string().min(1, 'اسم المدير بالإنجليزية مطلوب'),
});

// GET - List tenants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { company: { nameAr: { contains: search, mode: 'insensitive' } } },
        { company: { nameEn: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          company: {
            select: { nameAr: true, nameEn: true, phone: true, email: true },
          },
          _count: {
            select: { users: true, invoices: true, customers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST - Create tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = tenantSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if subdomain exists
    const existingSubdomain = await prisma.tenant.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existingSubdomain) {
      return Response.json(
        { success: false, error: 'النطاق الفرعي موجود بالفعل' },
        { status: 400 }
      );
    }

    // Check if admin email exists in any tenant
    const existingUser = await prisma.user.findFirst({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      return Response.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Create tenant with company and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          planType: data.planType,
          status: data.status,
        },
      });

      // Create company
      const company = await tx.company.create({
        data: {
          tenantId: tenant.id,
          nameAr: data.companyNameAr,
          nameEn: data.companyNameEn,
          taxNumber: data.taxNumber || '',
          commercialRegNumber: data.commercialRegNumber || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
        },
      });

      // Create admin user
      const passwordHash = await hash(data.adminPassword, 12);
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          passwordHash,
          nameAr: data.adminNameAr,
          nameEn: data.adminNameEn,
          role: 'ADMIN',
        },
      });

      return { tenant, company, adminUser };
    });

    return Response.json({
      success: true,
      data: result.tenant,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return Response.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
