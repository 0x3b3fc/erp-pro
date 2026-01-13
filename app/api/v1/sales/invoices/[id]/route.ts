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

// GET - Get single invoice with full details
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

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        lines: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true, nameEn: true },
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

    if (!invoice) {
      return notFoundResponse('Invoice not found');
    }

    return successResponse(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete draft invoice
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

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      return notFoundResponse('Invoice not found');
    }

    // Only draft invoices can be deleted
    if (invoice.status !== 'DRAFT') {
      return badRequestResponse('Only draft invoices can be deleted');
    }

    // Check if submitted to ETA
    if (invoice.etaUuid) {
      return badRequestResponse('Cannot delete invoice submitted to ETA');
    }

    // Delete invoice and lines
    await prisma.$transaction([
      prisma.invoiceLine.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.delete({ where: { id } }),
    ]);

    return successResponse({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update invoice status
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

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      return notFoundResponse('Invoice not found');
    }

    const body = await request.json();
    const { status } = body;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SENT', 'CANCELLED'],
      SENT: ['PAID', 'PARTIALLY_PAID', 'OVERDUE'],
      PARTIALLY_PAID: ['PAID', 'OVERDUE'],
    };

    if (status && validTransitions[invoice.status]?.includes(status)) {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status },
      });
      return successResponse(updated);
    }

    return badRequestResponse('Invalid status transition');
  } catch (error) {
    console.error('Error updating invoice:', error);
    return serverErrorResponse();
  }
}
