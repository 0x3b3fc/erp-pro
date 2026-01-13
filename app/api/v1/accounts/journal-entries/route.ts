import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  createdResponse,
  parsePaginationParams,
  buildPaginationMeta,
  getCurrentFiscalYear,
} from '@/lib/api/utils';
import { z } from 'zod';

// Validation schema for journal entry line
const lineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
  costCenterId: z.string().optional().nullable(),
});

// Validation schema for creating journal entry
const journalEntrySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  reference: z.string().optional(),
  description: z.string().min(1),
  lines: z.array(lineSchema).min(2),
});

// GET - List journal entries
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const fiscalYearId = searchParams.get('fiscalYearId');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    }

    if (fromDate) {
      where.date = { ...(where.date as object || {}), gte: new Date(fromDate) };
    }

    if (toDate) {
      where.date = { ...(where.date as object || {}), lte: new Date(toDate) };
    }

    if (fiscalYearId) {
      where.fiscalYearId = fiscalYearId;
    }

    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, code: true, nameAr: true, nameEn: true },
              },
            },
          },
          fiscalYear: {
            select: { id: true, name: true },
          },
          createdByUser: {
            select: { id: true, nameAr: true, nameEn: true },
          },
        },
        orderBy: [{ date: 'desc' }, { entryNumber: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return successResponse({
      entries,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return serverErrorResponse();
  }
}

// POST - Create journal entry
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = journalEntrySchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;
    const entryDate = new Date(data.date);

    // Validate that debits equal credits
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return badRequestResponse('Total debits must equal total credits');
    }

    // Each line must have either debit or credit, not both
    for (const line of data.lines) {
      if (line.debit > 0 && line.credit > 0) {
        return badRequestResponse('Each line must have either debit or credit, not both');
      }
      if (line.debit === 0 && line.credit === 0) {
        return badRequestResponse('Each line must have a debit or credit amount');
      }
    }

    // Get current fiscal year
    const fiscalYear = await getCurrentFiscalYear(tenantId);

    if (!fiscalYear) {
      return badRequestResponse('No active fiscal year found');
    }

    // Check if entry date is within fiscal year
    if (entryDate < fiscalYear.startDate || entryDate > fiscalYear.endDate) {
      return badRequestResponse('Entry date must be within the current fiscal year');
    }

    // Verify all accounts exist and belong to tenant
    const accountIds = data.lines.map(line => line.accountId);
    const accounts = await prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds }, tenantId },
    });

    if (accounts.length !== accountIds.length) {
      return badRequestResponse('One or more accounts not found');
    }

    // Check that none of the accounts are header accounts
    const headerAccounts = accounts.filter(a => a.isHeader);
    if (headerAccounts.length > 0) {
      return badRequestResponse('Cannot post to header accounts');
    }

    // Generate entry number
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { tenantId, fiscalYearId: fiscalYear.id },
      orderBy: { entryNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastEntry?.entryNumber) {
      const match = lastEntry.entryNumber.match(/JE-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const entryNumber = `JE-${nextNumber.toString().padStart(6, '0')}`;

    // Create journal entry with lines in transaction
    const entry = await prisma.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          tenantId,
          fiscalYearId: fiscalYear.id,
          entryNumber,
          date: entryDate,
          reference: data.reference,
          description: data.description,
          totalDebit,
          totalCredit,
          status: 'DRAFT',
          createdBy: userId,
          lines: {
            create: data.lines.map((line, index) => ({
              lineNumber: index + 1,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
              costCenterId: line.costCenterId,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, code: true, nameAr: true, nameEn: true },
              },
            },
          },
        },
      });

      return journalEntry;
    });

    return createdResponse(entry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return serverErrorResponse();
  }
}
