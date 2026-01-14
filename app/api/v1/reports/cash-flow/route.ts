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

        // Calculate date ranges for comparison
        const now = new Date();
        let currentStartDate: Date;
        let currentEndDate: Date;
        let previousStartDate: Date;
        let previousEndDate: Date;

        switch (period) {
            case 'month':
                currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                currentEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                currentStartDate = new Date(now.getFullYear(), quarter * 3, 1);
                currentEndDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
                previousEndDate = new Date(now.getFullYear(), (quarter - 1) * 3 + 3, 0);
                break;
            case 'year':
                currentStartDate = new Date(now.getFullYear(), 0, 1);
                currentEndDate = new Date(now.getFullYear(), 11, 31);
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                currentEndDate = now;
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        // Get cash/bank accounts
        const cashAccounts = await prisma.chartOfAccount.findMany({
            where: {
                tenantId,
                isActive: true,
                OR: [
                    { code: { startsWith: '101' } }, // Cash accounts
                    { code: { startsWith: '102' } }, // Bank accounts
                ],
            },
        });

        const cashAccountIds = cashAccounts.map(a => a.id);

        // Opening balance (balance before current period)
        const openingLines = await prisma.journalEntryLine.findMany({
            where: {
                accountId: { in: cashAccountIds },
                journalEntry: {
                    tenantId,
                    status: 'POSTED',
                    date: { lt: currentStartDate },
                },
            },
        });

        let openingBalance = 0;
        for (const line of openingLines) {
            openingBalance += Number(line.debit) - Number(line.credit);
        }

        // Current period movements grouped by source type
        const currentPeriodEntries = await prisma.journalEntry.findMany({
            where: {
                tenantId,
                status: 'POSTED',
                date: { gte: currentStartDate, lte: currentEndDate },
            },
            include: {
                lines: {
                    where: { accountId: { in: cashAccountIds } },
                },
            },
        });

        // Categorize cash flows
        const inflows: { label: string; amount: number }[] = [];
        const outflows: { label: string; amount: number }[] = [];

        // Group by source type
        const inflowsBySource = new Map<string, number>();
        const outflowsBySource = new Map<string, number>();

        for (const entry of currentPeriodEntries) {
            for (const line of entry.lines) {
                const netAmount = Number(line.debit) - Number(line.credit);
                const sourceType = entry.sourceType || 'MANUAL';

                if (netAmount > 0) {
                    // Inflow
                    inflowsBySource.set(
                        sourceType,
                        (inflowsBySource.get(sourceType) || 0) + netAmount
                    );
                } else {
                    // Outflow
                    outflowsBySource.set(
                        sourceType,
                        (outflowsBySource.get(sourceType) || 0) + Math.abs(netAmount)
                    );
                }
            }
        }

        // Convert to arrays with labels
        const sourceLabels: Record<string, string> = {
            INVOICE: 'تحصيلات المبيعات',
            RECEIPT: 'إيصالات قبض',
            BILL: 'مدفوعات المشتريات',
            PAYMENT: 'مدفوعات',
            PAYROLL: 'الرواتب',
            MANUAL: 'قيود يدوية',
            POS: 'نقاط البيع',
        };

        inflowsBySource.forEach((amount, source) => {
            inflows.push({
                label: sourceLabels[source] || source,
                amount,
            });
        });

        outflowsBySource.forEach((amount, source) => {
            outflows.push({
                label: sourceLabels[source] || source,
                amount,
            });
        });

        const totalInflows = inflows.reduce((sum, i) => sum + i.amount, 0);
        const totalOutflows = outflows.reduce((sum, o) => sum + o.amount, 0);
        const netCashFlow = totalInflows - totalOutflows;
        const closingBalance = openingBalance + netCashFlow;

        return NextResponse.json({
            success: true,
            data: {
                period: `${currentStartDate.toLocaleDateString('ar-EG')} - ${currentEndDate.toLocaleDateString('ar-EG')}`,
                openingBalance,
                inflows: {
                    items: inflows,
                    total: totalInflows,
                },
                outflows: {
                    items: outflows,
                    total: totalOutflows,
                },
                netCashFlow,
                closingBalance,
            },
        });
    } catch (error) {
        console.error('Error fetching cash flow:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch cash flow report' },
            { status: 500 }
        );
    }
}
