import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  getCurrentFiscalYear,
} from '@/lib/api/utils';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST - Create a reversing entry for a posted journal entry
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

    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        fiscalYear: true,
      },
    });

    if (!entry) {
      return notFoundResponse('Journal entry not found');
    }

    // Only posted entries can be reversed
    if (entry.status !== 'POSTED') {
      return badRequestResponse('Only posted entries can be reversed');
    }

    // Check if already reversed
    if (entry.reversedBy) {
      return badRequestResponse('This entry has already been reversed');
    }

    // Get current fiscal year
    const currentFiscalYear = await getCurrentFiscalYear(tenantId);

    if (!currentFiscalYear) {
      return badRequestResponse('No active fiscal year found');
    }

    // Generate entry number for reversal
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { tenantId, fiscalYearId: currentFiscalYear.id },
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

    // Create reversing entry
    const reversingEntry = await prisma.$transaction(async (tx) => {
      // Create the reversing journal entry
      const reversal = await tx.journalEntry.create({
        data: {
          tenantId,
          fiscalYearId: currentFiscalYear.id,
          entryNumber,
          date: new Date(),
          reference: `REV-${entry.entryNumber}`,
          description: `عكس القيد: ${entry.description}`,
          totalDebit: entry.totalCredit, // Swap debit and credit
          totalCredit: entry.totalDebit,
          status: 'POSTED',
          isReversing: true,
          reversesEntryId: entry.id,
          createdBy: userId,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: entry.lines.map((line, index) => ({
              lineNumber: index + 1,
              accountId: line.accountId,
              debit: line.credit, // Swap debit and credit
              credit: line.debit,
              description: `عكس: ${line.description || ''}`,
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

      // Mark original entry as reversed
      await tx.journalEntry.update({
        where: { id: entry.id },
        data: {
          reversedBy: reversal.id,
          reversedAt: new Date(),
        },
      });

      // Update account balances (reverse the effect)
      for (const line of entry.lines) {
        const account = line.account;
        const debitAmount = Number(line.debit);
        const creditAmount = Number(line.credit);
        let balanceChange = 0;

        // Reverse the original balance change
        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          balanceChange = creditAmount - debitAmount; // Opposite of posting
        } else {
          balanceChange = debitAmount - creditAmount; // Opposite of posting
        }

        await tx.chartOfAccount.update({
          where: { id: line.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

      return reversal;
    });

    return successResponse(reversingEntry);
  } catch (error) {
    console.error('Error reversing journal entry:', error);
    return serverErrorResponse();
  }
}
