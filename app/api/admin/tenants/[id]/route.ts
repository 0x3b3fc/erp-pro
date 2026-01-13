import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Validation schema for update
const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  planType: z.enum(['STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL']).optional(),
});

// GET - Get single tenant
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: {
            users: true,
            invoices: true,
            customers: true,
            suppliers: true,
            products: true,
          },
        },
      },
    });

    if (!tenant) {
      return Response.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateTenantSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if subdomain exists (if updating)
    if (data.subdomain) {
      const existing = await prisma.tenant.findFirst({
        where: {
          subdomain: data.subdomain,
          id: { not: id },
        },
      });

      if (existing) {
        return Response.json(
          { success: false, error: 'النطاق الفرعي موجود بالفعل' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data,
    });

    return Response.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return Response.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tenant
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return Response.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Delete tenant (cascade will delete all related data)
    await prisma.tenant.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return Response.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
