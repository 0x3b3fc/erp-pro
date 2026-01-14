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
        const period = searchParams.get('period') || 'month';
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Calculate date range based on period
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        switch (period) {
            case 'month':
                startDate = new Date(year, now.getMonth(), 1);
                endDate = new Date(year, now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(year, quarter * 3, 1);
                endDate = new Date(year, quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31);
                break;
            default:
                startDate = new Date(year, now.getMonth(), 1);
                endDate = new Date(year, now.getMonth() + 1, 0);
        }

        // Get revenue accounts (type REVENUE - typically codes starting with 4)
        const revenueAccounts = await prisma.chartOfAccount.findMany({
            where: {
                tenantId,
                accountType: 'REVENUE',
                isActive: true,
            },
        });

        // Get expense accounts (type EXPENSE - typically codes starting with 5)
        const expenseAccounts = await prisma.chartOfAccount.findMany({
            where: {
                tenantId,
                accountType: 'EXPENSE',
                isActive: true,
            },
        });

        // Get journal entries for the period
        const journalEntries = await prisma.journalEntry.findMany({
            where: {
                tenantId,
                status: 'POSTED',
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
        });

        // Calculate revenue totals
        const revenueItems: { label: string; amount: number }[] = [];
        let totalRevenue = 0;

        for (const account of revenueAccounts) {
            if (account.isHeader) continue;

            let accountTotal = 0;
            for (const entry of journalEntries) {
                for (const line of entry.lines) {
                    if (line.accountId === account.id) {
                        // Revenue accounts have credit balance
                        accountTotal += Number(line.credit) - Number(line.debit);
                    }
                }
            }

            if (accountTotal !== 0) {
                revenueItems.push({
                    label: account.nameAr,
                    amount: accountTotal,
                });
                totalRevenue += accountTotal;
            }
        }

        // Calculate expense totals
        const expenseItems: { label: string; amount: number }[] = [];
        let totalExpenses = 0;

        for (const account of expenseAccounts) {
            if (account.isHeader) continue;

            let accountTotal = 0;
            for (const entry of journalEntries) {
                for (const line of entry.lines) {
                    if (line.accountId === account.id) {
                        // Expense accounts have debit balance
                        accountTotal += Number(line.debit) - Number(line.credit);
                    }
                }
            }

            if (accountTotal !== 0) {
                expenseItems.push({
                    label: account.nameAr,
                    amount: accountTotal,
                });
                totalExpenses += accountTotal;
            }
        }

        // If no data, provide empty structure
        if (revenueItems.length === 0 && expenseItems.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    period: `${startDate.toLocaleDateString('ar-EG')} - ${endDate.toLocaleDateString('ar-EG')}`,
                    revenue: {
                        items: [],
                        total: 0,
                    },
                    expenses: {
                        items: [],
                        total: 0,
                    },
                    grossProfit: 0,
                    netIncome: 0,
                },
            });
        }

        const netIncome = totalRevenue - totalExpenses;

        return NextResponse.json({
            success: true,
            data: {
                period: `${startDate.toLocaleDateString('ar-EG')} - ${endDate.toLocaleDateString('ar-EG')}`,
                revenue: {
                    items: revenueItems,
                    total: totalRevenue,
                },
                expenses: {
                    items: expenseItems,
                    total: totalExpenses,
                },
                grossProfit: totalRevenue, // Simplified - no COGS tracking yet
                netIncome,
            },
        });
    } catch (error) {
        console.error('Error fetching income statement:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch income statement' },
            { status: 500 }
        );
    }
}
