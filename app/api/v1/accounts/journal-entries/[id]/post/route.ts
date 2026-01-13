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

// POST - Post journal entry (change status from DRAFT to POSTED)
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
      },
    });

    if (!entry) {
      return notFoundResponse('Journal entry not found');
    }

    // Only draft entries can be posted
    if (entry.status !== 'DRAFT') {
      return badRequestResponse('Only draft entries can be posted');
    }

    // Verify all accounts are still active
    const inactiveAccounts = entry.lines.filter(line => !line.account.isActive);
    if (inactiveAccounts.length > 0) {
      return badRequestResponse('Cannot post entry with inactive accounts');
    }

    // Update entry status and update account balances
    const updatedEntry = await prisma.$transaction(async (tx) => {
      // Update journal entry status
      const posted = await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: userId,
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

      // Update account balances
      for (const line of entry.lines) {
        const account = line.account;
        const debitAmount = Number(line.debit);
        const creditAmount = Number(line.credit);
        let balanceChange = 0;

        // Determine balance change based on account type
        // Assets & Expenses: Debit increases, Credit decreases
        // Liabilities, Equity & Revenue: Credit increases, Debit decreases
        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          balanceChange = debitAmount - creditAmount;
        } else {
          balanceChange = creditAmount - debitAmount;
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

      return posted;
    });

    return successResponse(updatedEntry);
  } catch (error) {
    console.error('Error posting journal entry:', error);
    return serverErrorResponse();
  }
}
