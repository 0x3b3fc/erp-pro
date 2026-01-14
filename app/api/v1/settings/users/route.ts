import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthSession, unauthorizedResponse, serverErrorResponse, successResponse } from '@/lib/api/utils';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// GET /api/v1/settings/users - Get users for tenant
export async function GET() {
    try {
        const { tenantId, userRole } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        // Only admin users can view users
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                email: true,
                nameAr: true,
                nameEn: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return serverErrorResponse();
    }
}

// Validation schema for creating user
const createUserSchema = z.object({
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    nameAr: z.string().min(1, 'الاسم بالعربية مطلوب'),
    nameEn: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'INVENTORY', 'HR', 'POS', 'USER']),
});

// POST /api/v1/settings/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const { tenantId, userRole } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        // Only admin users can create users
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if email already exists
        const existingUser = await prisma.user.findFirst({
            where: { email: data.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'البريد الإلكتروني موجود بالفعل' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                tenantId,
                email: data.email,
                passwordHash,
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                role: data.role,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                nameAr: true,
                nameEn: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return serverErrorResponse();
    }
}
