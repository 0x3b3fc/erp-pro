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
import { buildETADocument, validateForETA } from '@/lib/eta/document-builder';
import { createETAClient } from '@/lib/eta/client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST - Submit invoice to ETA
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    // Get invoice with all details
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        lines: {
          include: {
            product: {
              select: {
                sku: true,
                nameAr: true,
                etaItemCode: true,
                etaItemType: true,
              },
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
      return notFoundResponse('الفاتورة غير موجودة');
    }

    // Check if already submitted
    if (invoice.etaUuid) {
      return badRequestResponse('تم إرسال الفاتورة مسبقاً');
    }

    // Validate invoice status
    if (invoice.status !== 'APPROVED' && invoice.status !== 'SENT') {
      return badRequestResponse('يجب الموافقة على الفاتورة أولاً قبل الإرسال');
    }

    // Validate for ETA
    const validationErrors = validateForETA(invoice as any);
    if (validationErrors.length > 0) {
      return badRequestResponse(validationErrors.join('، '));
    }

    // Get company for ETA credentials
    const company = invoice.tenant.company;
    if (!company) {
      return badRequestResponse('بيانات الشركة غير مكتملة');
    }

    // Create ETA client
    const etaClient = await createETAClient(company.id);
    if (!etaClient) {
      return badRequestResponse('إعدادات الفاتورة الإلكترونية غير مكتملة');
    }

    // Build ETA document
    const etaDocument = await buildETADocument(id);

    // Submit to ETA
    const response = await etaClient.submitDocuments([etaDocument]);

    // Check for rejected documents
    if (response.rejectedDocuments.length > 0) {
      const rejection = response.rejectedDocuments[0];
      const errorMessage = rejection.error.details
        ?.map((d) => d.message)
        .join('، ') || rejection.error.message;

      // Update invoice with error
      await prisma.invoice.update({
        where: { id },
        data: {
          etaStatus: 'REJECTED',
          etaErrorMessage: errorMessage,
          etaSubmittedAt: new Date(),
        },
      });

      return badRequestResponse(`رفض ETA: ${errorMessage}`);
    }

    // Success - update invoice with UUID
    if (response.acceptedDocuments.length > 0) {
      const accepted = response.acceptedDocuments[0];

      await prisma.invoice.update({
        where: { id },
        data: {
          etaUuid: accepted.uuid,
          etaLongId: accepted.longId,
          etaHashKey: accepted.hashKey,
          etaSubmissionId: response.submissionId,
          etaStatus: 'SUBMITTED',
          etaSubmittedAt: new Date(),
          etaErrorMessage: null,
        },
      });

      return successResponse({
        message: 'تم إرسال الفاتورة بنجاح',
        uuid: accepted.uuid,
        longId: accepted.longId,
        submissionId: response.submissionId,
      });
    }

    return serverErrorResponse();
  } catch (error) {
    console.error('Error submitting invoice to ETA:', error);
    return serverErrorResponse();
  }
}
