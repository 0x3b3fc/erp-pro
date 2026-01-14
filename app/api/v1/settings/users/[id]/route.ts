import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthSession, unauthorizedResponse, notFoundResponse, serverErrorResponse, successResponse } from '@/lib/api/utils';
import { hash } from 'bcryptjs';
import { z } from 'zod';

type RouteParams = {
    params: Promise<{ id: string }>;
};

// Validation schema for updating user
const updateUserSchema = z.object({
    nameAr: z.string().min(1).optional(),
    nameEn: z.string().min(1).optional(),
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'INVENTORY', 'HR', 'POS', 'USER']).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional(),
});

// GET /api/v1/settings/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { tenantId, userRole } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        // Only admin users can view users
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const user = await prisma.user.findFirst({
            where: { id, tenantId },
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
        });

        if (!user) {
            return notFoundResponse('المستخدم غير موجود');
        }

        return successResponse(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return serverErrorResponse();
    }
}

// PATCH /api/v1/settings/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { tenantId, userRole, userId } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        // Only admin users can update users
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Check if user exists and belongs to tenant
        const existingUser = await prisma.user.findFirst({
            where: { id, tenantId },
        });

        if (!existingUser) {
            return notFoundResponse('المستخدم غير موجود');
        }

        // Prevent deactivating self
        if (id === userId) {
            const body = await request.json();
            if (body.isActive === false) {
                return NextResponse.json(
                    { success: false, error: 'لا يمكنك إلغاء تفعيل حسابك' },
                    { status: 400 }
                );
            }
        }

        const body = await request.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Prepare update data
        const updateData: Record<string, unknown> = {};
        if (data.nameAr) updateData.nameAr = data.nameAr;
        if (data.nameEn) updateData.nameEn = data.nameEn;
        if (data.role) updateData.role = data.role;
        if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
        if (data.password) updateData.passwordHash = await hash(data.password, 12);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
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
        });

        return successResponse(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return serverErrorResponse();
    }
}

// DELETE /api/v1/settings/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { tenantId, userRole, userId } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        // Only admin users can delete users
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Prevent deleting self
        if (id === userId) {
            return NextResponse.json(
                { success: false, error: 'لا يمكنك حذف حسابك' },
                { status: 400 }
            );
        }

        // Check if user exists and belongs to tenant
        const existingUser = await prisma.user.findFirst({
            where: { id, tenantId },
        });

        if (!existingUser) {
            return notFoundResponse('المستخدم غير موجود');
        }

        await prisma.user.delete({
            where: { id },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return serverErrorResponse();
    }
}
