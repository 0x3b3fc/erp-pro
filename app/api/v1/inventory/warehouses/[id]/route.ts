import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api/utils';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Get single warehouse
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            stockLevels: true,
            stockMovements: true,
          },
        },
      },
    });

    if (!warehouse) {
      return notFoundResponse('Warehouse not found');
    }

    return successResponse(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update warehouse
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
    });

    if (!warehouse) {
      return notFoundResponse('Warehouse not found');
    }

    const body = await request.json();
    const { isDefault, ...updateData } = body;

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await prisma.warehouse.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        ...updateData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete warehouse (only if no stock)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: {
        stockLevels: true,
      },
    });

    if (!warehouse) {
      return notFoundResponse('Warehouse not found');
    }

    // Check if warehouse has stock
    const hasStock = warehouse.stockLevels.some(
      (sl) => Number(sl.quantity) > 0
    );

    if (hasStock) {
      return badRequestResponse('Cannot delete warehouse with stock. Please transfer or adjust stock first.');
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return successResponse({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return serverErrorResponse();
  }
}
