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
        const warehouseId = searchParams.get('warehouse');
        const type = searchParams.get('type');

        // Calculate date range based on period
        let startDate: Date;
        const now = new Date();

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Build where clause
        const whereClause: Record<string, unknown> = {
            tenantId,
            createdAt: { gte: startDate },
        };

        if (warehouseId && warehouseId !== 'all') {
            whereClause.warehouseId = warehouseId;
        }

        if (type && type !== 'all') {
            whereClause.movementType = type.toUpperCase();
        }

        // Fetch stock movements
        const movements = await prisma.stockMovement.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        sku: true,
                        nameAr: true,
                        nameEn: true,
                        costPrice: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        nameAr: true,
                        nameEn: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        // Calculate summary
        let totalIn = 0;
        let totalOut = 0;
        let totalValue = 0;

        const formattedMovements = movements.map((m) => {
            const quantity = Number(m.quantity);
            const unitCost = Number(m.product.costPrice);
            const value = Math.abs(quantity * unitCost);

            if (m.movementType === 'IN' || m.movementType === 'TRANSFER_IN') {
                totalIn += Math.abs(quantity);
            } else if (m.movementType === 'OUT' || m.movementType === 'TRANSFER_OUT') {
                totalOut += Math.abs(quantity);
            }
            totalValue += value;

            return {
                id: m.id,
                date: m.createdAt.toISOString().split('T')[0],
                productCode: m.product.sku,
                productName: m.product.nameAr,
                type: m.movementType.toLowerCase(),
                reason: m.notes || '',
                reference: m.referenceId || '',
                warehouse: m.warehouse?.nameAr || '',
                quantity: m.movementType.includes('OUT') ? -Math.abs(quantity) : Math.abs(quantity),
                unitCost,
                totalValue: value,
                balanceAfter: 0,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                movements: formattedMovements,
                summary: {
                    totalIn,
                    totalOut,
                    netChange: totalIn - totalOut,
                    totalValue,
                    movementCount: movements.length,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching inventory movements:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inventory movements' },
            { status: 500 }
        );
    }
}
