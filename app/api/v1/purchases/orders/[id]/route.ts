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

// GET - Get single purchase order with full details
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

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        lines: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true, nameEn: true },
            },
            warehouse: {
              select: { id: true, code: true, nameAr: true, nameEn: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        bills: {
          select: {
            id: true,
            billNumber: true,
            date: true,
            total: true,
            status: true,
          },
        },
        tenant: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Purchase order not found');
    }

    return successResponse(order);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update purchase order (status or details)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId, userId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      return notFoundResponse('Purchase order not found');
    }

    const body = await request.json();
    const { status, approvedBy } = body;

    // Handle status update
    if (status) {
      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
        PENDING_APPROVAL: ['APPROVED', 'DRAFT', 'CANCELLED'],
        APPROVED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
        PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return badRequestResponse('Invalid status transition');
      }

      // If approving, set approvedBy and approvedAt
      const updateData: Record<string, unknown> = { status };
      if (status === 'APPROVED' && userId) {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: updateData,
      });

      return successResponse(updated);
    }

    // Handle other updates (only for DRAFT status)
    if (order.status !== 'DRAFT') {
      return badRequestResponse('Only draft orders can be updated');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: body,
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete draft purchase order
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

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        bills: true,
      },
    });

    if (!order) {
      return notFoundResponse('Purchase order not found');
    }

    // Only draft orders can be deleted
    if (order.status !== 'DRAFT') {
      return badRequestResponse('Only draft orders can be deleted');
    }

    // Check if linked to any bills
    if (order.bills.length > 0) {
      return badRequestResponse('Cannot delete order linked to bills');
    }

    // Delete order and lines
    await prisma.$transaction([
      prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } }),
      prisma.purchaseOrder.delete({ where: { id } }),
    ]);

    return successResponse({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return serverErrorResponse();
  }
}
