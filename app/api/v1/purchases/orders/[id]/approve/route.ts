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

// POST - Approve purchase order
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId, userId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      return notFoundResponse('Purchase order not found');
    }

    // Only PENDING_APPROVAL or DRAFT orders can be approved
    if (order.status !== 'PENDING_APPROVAL' && order.status !== 'DRAFT') {
      return badRequestResponse('Only pending or draft orders can be approved');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error approving purchase order:', error);
    return serverErrorResponse();
  }
}
