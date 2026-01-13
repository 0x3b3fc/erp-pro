import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Validation schema
const adminSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  name: z.string().min(1, 'الاسم مطلوب'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']).default('ADMIN'),
  isActive: z.boolean().default(true),
});

// GET - List system admins
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.systemAdmin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.systemAdmin.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: {
        admins,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// POST - Create system admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = adminSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email exists
    const existing = await prisma.systemAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return Response.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(data.password, 12);

    const admin = await prisma.systemAdmin.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      },
    });

    // Don't return password hash
    const { passwordHash: _, ...adminWithoutPassword } = admin;

    return Response.json({
      success: true,
      data: adminWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return Response.json(
      { success: false, error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
