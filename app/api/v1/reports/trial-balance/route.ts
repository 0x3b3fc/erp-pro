import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  getCurrentFiscalYear,
} from '@/lib/api/utils';

// GET - Get trial balance report
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const asOfDate = searchParams.get('asOfDate');
    const fiscalYearId = searchParams.get('fiscalYearId');
    const showZeroBalances = searchParams.get('showZeroBalances') === 'true';
    const groupByType = searchParams.get('groupByType') !== 'false';

    // Get fiscal year
    let fiscalYear;
    if (fiscalYearId) {
      fiscalYear = await prisma.fiscalYear.findFirst({
        where: { id: fiscalYearId, tenantId },
      });
    } else {
      fiscalYear = await getCurrentFiscalYear(tenantId);
    }

    if (!fiscalYear) {
      return badRequestResponse('No fiscal year found');
    }

    // Determine the effective date
    const effectiveDate = asOfDate ? new Date(asOfDate) : new Date();

    // Get all accounts for the tenant
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        tenantId,
        isHeader: false, // Only leaf accounts have balances
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    // Get journal entry lines for the period
    const journalLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          tenantId,
          fiscalYearId: fiscalYear.id,
          status: 'POSTED',
          date: { lte: effectiveDate },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
            accountType: true,
          },
        },
        journalEntry: {
          select: { date: true },
        },
      },
    });

    // Calculate balances per account
    const accountBalances = new Map<string, { debit: number; credit: number }>();

    for (const line of journalLines) {
      const existing = accountBalances.get(line.accountId) || { debit: 0, credit: 0 };
      existing.debit += Number(line.debit);
      existing.credit += Number(line.credit);
      accountBalances.set(line.accountId, existing);
    }

    // Build trial balance data
    type TrialBalanceRow = {
      accountId: string;
      code: string;
      nameAr: string;
      nameEn: string;
      accountType: string;
      debit: number;
      credit: number;
      balance: number;
    };

    const trialBalanceRows: TrialBalanceRow[] = [];

    for (const account of accounts) {
      const balances = accountBalances.get(account.id) || { debit: 0, credit: 0 };
      const debit = balances.debit;
      const credit = balances.credit;

      // Calculate closing balance based on account type
      let balance = 0;
      if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }

      // Skip zero balances if not showing them
      if (!showZeroBalances && Math.abs(balance) < 0.01 && debit === 0 && credit === 0) {
        continue;
      }

      trialBalanceRows.push({
        accountId: account.id,
        code: account.code,
        nameAr: account.nameAr,
        nameEn: account.nameEn,
        accountType: account.accountType,
        debit,
        credit,
        balance,
      });
    }

    // Calculate totals
    const totals = trialBalanceRows.reduce(
      (acc, row) => ({
        debit: acc.debit + row.debit,
        credit: acc.credit + row.credit,
      }),
      { debit: 0, credit: 0 }
    );

    // Group by account type if requested
    let groupedData: Record<string, TrialBalanceRow[]> | null = null;
    if (groupByType) {
      groupedData = {
        ASSET: [],
        LIABILITY: [],
        EQUITY: [],
        REVENUE: [],
        EXPENSE: [],
      };

      for (const row of trialBalanceRows) {
        if (groupedData[row.accountType]) {
          groupedData[row.accountType].push(row);
        }
      }
    }

    // Calculate summary by type
    const summaryByType = {
      ASSET: { debit: 0, credit: 0, balance: 0 },
      LIABILITY: { debit: 0, credit: 0, balance: 0 },
      EQUITY: { debit: 0, credit: 0, balance: 0 },
      REVENUE: { debit: 0, credit: 0, balance: 0 },
      EXPENSE: { debit: 0, credit: 0, balance: 0 },
    };

    for (const row of trialBalanceRows) {
      const type = row.accountType as keyof typeof summaryByType;
      if (summaryByType[type]) {
        summaryByType[type].debit += row.debit;
        summaryByType[type].credit += row.credit;
        summaryByType[type].balance += row.balance;
      }
    }

    return successResponse({
      fiscalYear: {
        id: fiscalYear.id,
        name: fiscalYear.name,
        startDate: fiscalYear.startDate,
        endDate: fiscalYear.endDate,
      },
      asOfDate: effectiveDate.toISOString(),
      accounts: groupByType ? groupedData : trialBalanceRows,
      totals,
      summaryByType,
      isBalanced: Math.abs(totals.debit - totals.credit) < 0.01,
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    return serverErrorResponse();
  }
}
