import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/api/utils';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await getAuthSession();
        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const asOfDate = searchParams.get('date')
            ? new Date(searchParams.get('date')!)
            : new Date();

        // Get all accounts with their balances
        const accounts = await prisma.chartOfAccount.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            orderBy: { code: 'asc' },
        });

        // Get all posted journal entry lines up to the date
        const journalLines = await prisma.journalEntryLine.findMany({
            where: {
                journalEntry: {
                    tenantId,
                    status: 'POSTED',
                    date: { lte: asOfDate },
                },
            },
            include: {
                account: true,
            },
        });

        // Calculate balances for each account
        const accountBalances = new Map<string, number>();

        for (const line of journalLines) {
            const accountId = line.accountId;
            const currentBalance = accountBalances.get(accountId) || 0;
            const account = accounts.find(a => a.id === accountId);

            if (!account) continue;

            // Asset & Expense accounts: Debit increases, Credit decreases
            // Liability, Equity & Revenue accounts: Credit increases, Debit decreases
            if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
                accountBalances.set(accountId, currentBalance + Number(line.debit) - Number(line.credit));
            } else {
                accountBalances.set(accountId, currentBalance + Number(line.credit) - Number(line.debit));
            }
        }

        // Group accounts by type
        const assets: { code: string; name: string; balance: number }[] = [];
        const liabilities: { code: string; name: string; balance: number }[] = [];
        const equity: { code: string; name: string; balance: number }[] = [];

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        for (const account of accounts) {
            if (account.isHeader) continue;

            const balance = accountBalances.get(account.id) || 0;
            if (balance === 0) continue;

            const item = {
                code: account.code,
                name: account.nameAr,
                balance,
            };

            switch (account.accountType) {
                case 'ASSET':
                    assets.push(item);
                    totalAssets += balance;
                    break;
                case 'LIABILITY':
                    liabilities.push(item);
                    totalLiabilities += balance;
                    break;
                case 'EQUITY':
                    equity.push(item);
                    totalEquity += balance;
                    break;
            }
        }

        // Calculate retained earnings (Revenue - Expenses)
        let retainedEarnings = 0;
        for (const account of accounts) {
            if (account.isHeader) continue;
            const balance = accountBalances.get(account.id) || 0;

            if (account.accountType === 'REVENUE') {
                retainedEarnings += balance;
            } else if (account.accountType === 'EXPENSE') {
                retainedEarnings -= balance;
            }
        }

        if (retainedEarnings !== 0) {
            equity.push({
                code: 'RE',
                name: 'الأرباح المحتجزة',
                balance: retainedEarnings,
            });
            totalEquity += retainedEarnings;
        }

        return NextResponse.json({
            success: true,
            data: {
                date: asOfDate.toISOString().split('T')[0],
                assets: {
                    items: assets,
                    total: totalAssets,
                },
                liabilities: {
                    items: liabilities,
                    total: totalLiabilities,
                },
                equity: {
                    items: equity,
                    total: totalEquity,
                },
                totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
                isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
            },
        });
    } catch (error) {
        console.error('Error fetching balance sheet:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch balance sheet' },
            { status: 500 }
        );
    }
}
