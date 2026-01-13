import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Validation schema for update
const updateAdminSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get single admin
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const admin = await prisma.systemAdmin.findUnique({
      where: { id },
    });

    if (!admin) {
      return Response.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Don't return password hash
    const { passwordHash: _, ...adminWithoutPassword } = admin;

    return Response.json({
      success: true,
      data: adminWithoutPassword,
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}

// PATCH - Update admin
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateAdminSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email exists (if updating)
    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      const existing = await prisma.systemAdmin.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: id },
        },
      });

      if (existing) {
        return Response.json(
          { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.trim().toLowerCase();
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await hash(data.password, 12);
    }

    const updated = await prisma.systemAdmin.update({
      where: { id },
      data: updateData,
    });

    // Don't return password hash
    const { passwordHash: _, ...adminWithoutPassword } = updated;

    return Response.json({
      success: true,
      data: adminWithoutPassword,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return Response.json(
      { success: false, error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if admin exists
    const admin = await prisma.systemAdmin.findUnique({
      where: { id },
    });

    if (!admin) {
      return Response.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Prevent deleting super admin
    if (admin.role === 'SUPER_ADMIN') {
      return Response.json(
        { success: false, error: 'Cannot delete super admin' },
        { status: 400 }
      );
    }

    // Delete admin
    await prisma.systemAdmin.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return Response.json(
      { success: false, error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
