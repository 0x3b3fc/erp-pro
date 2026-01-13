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
import { createETAClient } from '@/lib/eta/client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Check ETA status for invoice
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
        tenant: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!invoice) {
      return notFoundResponse('الفاتورة غير موجودة');
    }

    if (!invoice.etaUuid) {
      return badRequestResponse('لم يتم إرسال الفاتورة لمصلحة الضرائب بعد');
    }

    const company = invoice.tenant.company;
    if (!company) {
      return badRequestResponse('بيانات الشركة غير مكتملة');
    }

    const etaClient = await createETAClient(company.id);
    if (!etaClient) {
      return badRequestResponse('إعدادات الفاتورة الإلكترونية غير مكتملة');
    }

    // Get status from ETA
    const status = await etaClient.getDocumentStatus(invoice.etaUuid);

    // Update local status
    let localStatus = invoice.etaStatus;
    if (status.status === 'Valid') {
      localStatus = 'VALID';
    } else if (status.status === 'Invalid' || status.status === 'Rejected') {
      localStatus = 'REJECTED';
    } else if (status.status === 'Cancelled') {
      localStatus = 'CANCELLED';
    }

    // Update invoice if status changed
    if (localStatus !== invoice.etaStatus) {
      await prisma.invoice.update({
        where: { id },
        data: {
          etaStatus: localStatus,
        },
      });
    }

    return successResponse({
      uuid: invoice.etaUuid,
      status: status.status,
      localStatus,
      validationResults: status.validationResults,
    });
  } catch (error) {
    console.error('Error checking ETA status:', error);
    return serverErrorResponse();
  }
}
