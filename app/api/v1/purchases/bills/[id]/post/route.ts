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

// POST - Post purchase bill (create journal entry and update stock)
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

    const bill = await prisma.purchaseBill.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        lines: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                trackInventory: true,
                isService: true,
                costPrice: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      return notFoundResponse('Purchase bill not found');
    }

    // Only draft bills can be posted
    if (bill.status !== 'DRAFT') {
      return badRequestResponse('Only draft bills can be posted');
    }

    // Check if already posted
    if (bill.journalEntryId) {
      return badRequestResponse('Bill already posted');
    }

    // Get fiscal year
    const fiscalYear = await getCurrentFiscalYear(tenantId);
    if (!fiscalYear) {
      return badRequestResponse('No active fiscal year found');
    }

    // Get system accounts (we'll need to find or create these)
    // For now, we'll use a simple approach: find accounts by type
    const [apAccount, inventoryAccount, vatInputAccount] = await Promise.all([
      // Accounts Payable
      prisma.chartOfAccount.findFirst({
        where: {
          tenantId,
          accountType: 'LIABILITY',
          code: { startsWith: '2' }, // Typically AP accounts start with 2
          nameEn: { contains: 'Payable', mode: 'insensitive' },
        },
      }),
      // Inventory
      prisma.chartOfAccount.findFirst({
        where: {
          tenantId,
          accountType: 'ASSET',
          code: { startsWith: '1' }, // Typically inventory accounts start with 1
          nameEn: { contains: 'Inventory', mode: 'insensitive' },
        },
      }),
      // VAT Input
      prisma.chartOfAccount.findFirst({
        where: {
          tenantId,
          accountType: 'ASSET',
          nameEn: { contains: 'VAT Input', mode: 'insensitive' },
        },
      }),
    ]);

    if (!apAccount || !inventoryAccount || !vatInputAccount) {
      return badRequestResponse(
        'Required accounts not found. Please set up Accounts Payable, Inventory, and VAT Input accounts.'
      );
    }

    // Generate journal entry number
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

    // Calculate totals
    const subtotal = Number(bill.subtotal);
    const vatAmount = Number(bill.vatAmount);
    const total = Number(bill.total);

    // Create journal entry and update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create journal entry lines
      const journalLines = [];

      // For each line, determine if it's inventory or expense
      let totalInventoryDebit = 0;
      let totalExpenseDebit = 0;

      for (const line of bill.lines) {
        const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
        const lineVat = Number(line.taxAmount);
        const lineTotal = lineSubtotal + lineVat;

        if (line.product && line.product.trackInventory && !line.product.isService) {
          // Inventory item
          totalInventoryDebit += lineTotal;
        } else {
          // Expense item (service or non-tracked)
          totalExpenseDebit += lineTotal;
        }
      }

      // Debit: Inventory (for tracked products)
      if (totalInventoryDebit > 0) {
        journalLines.push({
          accountId: inventoryAccount.id,
          debit: totalInventoryDebit,
          credit: 0,
          description: `Purchase Bill ${bill.billNumber} - Inventory`,
        });
      }

      // Debit: Expenses (for services/non-tracked) - use first expense account or inventory as fallback
      if (totalExpenseDebit > 0) {
        const expenseAccount = await tx.chartOfAccount.findFirst({
          where: {
            tenantId,
            accountType: 'EXPENSE',
            code: { startsWith: '5' },
          },
        });

        if (expenseAccount) {
          journalLines.push({
            accountId: expenseAccount.id,
            debit: totalExpenseDebit,
            credit: 0,
            description: `Purchase Bill ${bill.billNumber} - Expenses`,
          });
        } else {
          // Fallback to inventory account if no expense account found
          journalLines.push({
            accountId: inventoryAccount.id,
            debit: totalExpenseDebit,
            credit: 0,
            description: `Purchase Bill ${bill.billNumber} - Expenses`,
          });
        }
      }

      // Debit: VAT Input
      if (vatAmount > 0) {
        journalLines.push({
          accountId: vatInputAccount.id,
          debit: vatAmount,
          credit: 0,
          description: `Purchase Bill ${bill.billNumber} - VAT Input`,
        });
      }

      // Credit: Accounts Payable
      journalLines.push({
        accountId: apAccount.id,
        debit: 0,
        credit: total,
        description: `Purchase Bill ${bill.billNumber} - ${bill.supplier.nameAr}`,
      });

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          tenantId,
          fiscalYearId: fiscalYear.id,
          entryNumber,
          date: bill.date,
          reference: bill.billNumber,
          description: `Purchase Bill ${bill.billNumber} - ${bill.supplier.nameAr}`,
          totalDebit: total,
          totalCredit: total,
          status: 'POSTED', // Auto-post
          sourceType: 'BILL',
          sourceId: id,
          createdBy: userId,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: journalLines.map((line, index) => ({
              lineNumber: index + 1,
              ...line,
            })),
          },
        },
      });

      // Update account balances
      for (const line of journalLines) {
        const account = await tx.chartOfAccount.findUnique({
          where: { id: line.accountId },
        });

        if (!account) continue;

        let balanceChange = 0;
        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          balanceChange = line.debit - line.credit;
        } else {
          balanceChange = line.credit - line.debit;
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

      // Update stock levels and create stock movements for inventory items
      for (const line of bill.lines) {
        if (
          line.product &&
          line.product.trackInventory &&
          !line.product.isService &&
          line.warehouseId
        ) {
          const quantity = Number(line.quantity);
          const costPrice = Number(line.unitPrice);

          // Get current stock level for weighted average calculation
          const currentStock = await tx.stockLevel.findUnique({
            where: {
              productId_warehouseId: {
                productId: line.productId!,
                warehouseId: line.warehouseId,
              },
            },
          });

          let newAvgCost = costPrice;
          if (currentStock) {
            const currentQty = Number(currentStock.quantity);
            const currentCost = Number(currentStock.avgCost);
            const totalQty = currentQty + quantity;
            
            if (totalQty > 0) {
              newAvgCost = (currentQty * currentCost + quantity * costPrice) / totalQty;
            }
          }

          // Update or create stock level
          const stockLevel = await tx.stockLevel.upsert({
            where: {
              productId_warehouseId: {
                productId: line.productId!,
                warehouseId: line.warehouseId,
              },
            },
            update: {
              quantity: {
                increment: quantity,
              },
              avgCost: newAvgCost,
            },
            create: {
              tenantId,
              productId: line.productId!,
              warehouseId: line.warehouseId,
              quantity,
              avgCost: costPrice,
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: line.productId!,
              warehouseId: line.warehouseId,
              movementType: 'IN',
              quantity,
              costPrice,
              referenceType: 'BILL',
              referenceId: id,
              date: bill.date,
              notes: `Purchase Bill ${bill.billNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // Update bill status and link journal entry
      const updatedBill = await tx.purchaseBill.update({
        where: { id },
        data: {
          status: 'APPROVED',
          journalEntryId: journalEntry.id,
        },
      });

      return { bill: updatedBill, journalEntry };
    });

    return successResponse(result);
  } catch (error) {
    console.error('Error posting purchase bill:', error);
    return serverErrorResponse();
  }
}
