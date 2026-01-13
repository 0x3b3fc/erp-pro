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

// GET - Get single journal entry
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

    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, nameAr: true, nameEn: true, accountType: true },
            },
            costCenter: {
              select: { id: true, code: true, nameAr: true, nameEn: true },
            },
          },
          orderBy: { lineNumber: 'asc' },
        },
        fiscalYear: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        createdByUser: {
          select: { id: true, nameAr: true, nameEn: true, email: true },
        },
        postedByUser: {
          select: { id: true, nameAr: true, nameEn: true, email: true },
        },
      },
    });

    if (!entry) {
      return notFoundResponse('Journal entry not found');
    }

    return successResponse(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete draft journal entry
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

    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
    });

    if (!entry) {
      return notFoundResponse('Journal entry not found');
    }

    // Only draft entries can be deleted
    if (entry.status !== 'DRAFT') {
      return badRequestResponse('Only draft entries can be deleted');
    }

    // Delete entry and its lines
    await prisma.$transaction([
      prisma.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      }),
      prisma.journalEntry.delete({
        where: { id },
      }),
    ]);

    return successResponse({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return serverErrorResponse();
  }
}
