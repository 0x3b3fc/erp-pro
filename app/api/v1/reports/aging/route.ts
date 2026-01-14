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
        const type = searchParams.get('type') || 'ar'; // ar = receivables, ap = payables

        const today = new Date();

        if (type === 'ar') {
            // Accounts Receivable Aging - Based on unpaid invoices
            const invoices = await prisma.invoice.findMany({
                where: {
                    tenantId,
                    status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            code: true,
                            nameAr: true,
                            nameEn: true,
                        },
                    },
                },
            });

            // Group by customer and calculate aging buckets
            const customerAgingMap = new Map<string, {
                id: string;
                code: string;
                name: string;
                current: number;
                days1to30: number;
                days31to60: number;
                days61to90: number;
                over90: number;
                total: number;
            }>();

            for (const invoice of invoices) {
                const unpaidAmount = Number(invoice.total) - Number(invoice.paidAmount);
                if (unpaidAmount <= 0) continue;

                const dueDate = new Date(invoice.dueDate);
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                const customerId = invoice.customerId;
                const existing = customerAgingMap.get(customerId) || {
                    id: invoice.customer.id,
                    code: invoice.customer.code,
                    name: invoice.customer.nameAr,
                    current: 0,
                    days1to30: 0,
                    days31to60: 0,
                    days61to90: 0,
                    over90: 0,
                    total: 0,
                };

                if (daysOverdue <= 0) {
                    existing.current += unpaidAmount;
                } else if (daysOverdue <= 30) {
                    existing.days1to30 += unpaidAmount;
                } else if (daysOverdue <= 60) {
                    existing.days31to60 += unpaidAmount;
                } else if (daysOverdue <= 90) {
                    existing.days61to90 += unpaidAmount;
                } else {
                    existing.over90 += unpaidAmount;
                }
                existing.total += unpaidAmount;

                customerAgingMap.set(customerId, existing);
            }

            const items = Array.from(customerAgingMap.values());
            const summary = items.reduce(
                (acc, item) => ({
                    current: acc.current + item.current,
                    days1to30: acc.days1to30 + item.days1to30,
                    days31to60: acc.days31to60 + item.days31to60,
                    days61to90: acc.days61to90 + item.days61to90,
                    over90: acc.over90 + item.over90,
                    total: acc.total + item.total,
                }),
                { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 }
            );

            return NextResponse.json({
                success: true,
                data: { summary, items },
            });
        } else {
            // Accounts Payable Aging - Based on unpaid bills
            const bills = await prisma.purchaseBill.findMany({
                where: {
                    tenantId,
                    status: { in: ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] },
                },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            code: true,
                            nameAr: true,
                            nameEn: true,
                        },
                    },
                },
            });

            // Group by supplier and calculate aging buckets
            const supplierAgingMap = new Map<string, {
                id: string;
                code: string;
                name: string;
                current: number;
                days1to30: number;
                days31to60: number;
                days61to90: number;
                over90: number;
                total: number;
            }>();

            for (const bill of bills) {
                const unpaidAmount = Number(bill.total) - Number(bill.paidAmount);
                if (unpaidAmount <= 0) continue;

                const dueDate = new Date(bill.dueDate);
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                const supplierId = bill.supplierId;
                const existing = supplierAgingMap.get(supplierId) || {
                    id: bill.supplier.id,
                    code: bill.supplier.code,
                    name: bill.supplier.nameAr,
                    current: 0,
                    days1to30: 0,
                    days31to60: 0,
                    days61to90: 0,
                    over90: 0,
                    total: 0,
                };

                if (daysOverdue <= 0) {
                    existing.current += unpaidAmount;
                } else if (daysOverdue <= 30) {
                    existing.days1to30 += unpaidAmount;
                } else if (daysOverdue <= 60) {
                    existing.days31to60 += unpaidAmount;
                } else if (daysOverdue <= 90) {
                    existing.days61to90 += unpaidAmount;
                } else {
                    existing.over90 += unpaidAmount;
                }
                existing.total += unpaidAmount;

                supplierAgingMap.set(supplierId, existing);
            }

            const items = Array.from(supplierAgingMap.values());
            const summary = items.reduce(
                (acc, item) => ({
                    current: acc.current + item.current,
                    days1to30: acc.days1to30 + item.days1to30,
                    days31to60: acc.days31to60 + item.days31to60,
                    days61to90: acc.days61to90 + item.days61to90,
                    over90: acc.over90 + item.over90,
                    total: acc.total + item.total,
                }),
                { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 }
            );

            return NextResponse.json({
                success: true,
                data: { summary, items },
            });
        }
    } catch (error) {
        console.error('Error fetching aging report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch aging report' },
            { status: 500 }
        );
    }
}
