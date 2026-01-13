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

// GET - Get single purchase bill with full details
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

    const bill = await prisma.purchaseBill.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        purchaseOrder: {
          select: { id: true, poNumber: true },
        },
        lines: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true, nameEn: true, trackInventory: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        tenant: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!bill) {
      return notFoundResponse('Purchase bill not found');
    }

    return successResponse(bill);
  } catch (error) {
    console.error('Error fetching purchase bill:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update purchase bill (only DRAFT status)
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

    const bill = await prisma.purchaseBill.findFirst({
      where: { id, tenantId },
    });

    if (!bill) {
      return notFoundResponse('Purchase bill not found');
    }

    // Only draft bills can be updated
    if (bill.status !== 'DRAFT') {
      return badRequestResponse('Only draft bills can be updated');
    }

    // Check if already posted
    if (bill.journalEntryId) {
      return badRequestResponse('Cannot update posted bill');
    }

    const body = await request.json();
    const updated = await prisma.purchaseBill.update({
      where: { id },
      data: body,
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating purchase bill:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete draft purchase bill
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

    const bill = await prisma.purchaseBill.findFirst({
      where: { id, tenantId },
    });

    if (!bill) {
      return notFoundResponse('Purchase bill not found');
    }

    // Only draft bills can be deleted
    if (bill.status !== 'DRAFT') {
      return badRequestResponse('Only draft bills can be deleted');
    }

    // Check if already posted
    if (bill.journalEntryId) {
      return badRequestResponse('Cannot delete posted bill');
    }

    // Delete bill and lines
    await prisma.$transaction([
      prisma.purchaseBillLine.deleteMany({ where: { billId: id } }),
      prisma.purchaseBill.delete({ where: { id } }),
    ]);

    return successResponse({ message: 'Purchase bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase bill:', error);
    return serverErrorResponse();
  }
}
