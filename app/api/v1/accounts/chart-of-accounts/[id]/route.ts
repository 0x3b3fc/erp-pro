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
import { z } from 'zod';

// Validation schema for updating account
const updateAccountSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  nameAr: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  parentId: z.string().optional().nullable(),
  isHeader: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Get single account
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const account = await prisma.chartOfAccount.findFirst({
      where: { id, tenantId },
      include: {
        parent: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
        children: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!account) {
      return notFoundResponse('Account not found');
    }

    return successResponse(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update account
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId, userId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const existingAccount = await prisma.chartOfAccount.findFirst({
      where: { id, tenantId },
    });

    if (!existingAccount) {
      return notFoundResponse('Account not found');
    }

    // System accounts cannot be modified
    if (existingAccount.isSystemAccount) {
      return badRequestResponse('System accounts cannot be modified');
    }

    const body = await request.json();
    const validation = updateAccountSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // If changing code, check uniqueness
    if (data.code && data.code !== existingAccount.code) {
      const duplicateCode = await prisma.chartOfAccount.findFirst({
        where: { tenantId, code: data.code, id: { not: id } },
      });

      if (duplicateCode) {
        return badRequestResponse('Account code already exists');
      }
    }

    // If changing parentId, validate
    if (data.parentId !== undefined && data.parentId !== existingAccount.parentId) {
      if (data.parentId) {
        const parentAccount = await prisma.chartOfAccount.findFirst({
          where: { id: data.parentId, tenantId },
        });

        if (!parentAccount) {
          return badRequestResponse('Parent account not found');
        }

        // Cannot set self as parent
        if (data.parentId === id) {
          return badRequestResponse('Account cannot be its own parent');
        }

        // Check for circular reference
        let currentParent = parentAccount;
        while (currentParent.parentId) {
          if (currentParent.parentId === id) {
            return badRequestResponse('Circular reference detected');
          }
          const nextParent = await prisma.chartOfAccount.findUnique({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }
    }

    // Calculate new level if parent changed
    let level = existingAccount.level;
    if (data.parentId !== undefined && data.parentId !== existingAccount.parentId) {
      if (data.parentId) {
        const parent = await prisma.chartOfAccount.findUnique({
          where: { id: data.parentId },
          select: { level: true },
        });
        level = (parent?.level || 0) + 1;
      } else {
        level = 1;
      }
    }

    const updatedAccount = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        ...data,
        level,
      },
    });

    return successResponse(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const account = await prisma.chartOfAccount.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      return notFoundResponse('Account not found');
    }

    // System accounts cannot be deleted
    if (account.isSystemAccount) {
      return badRequestResponse('System accounts cannot be deleted');
    }

    // Check if account has children
    const childrenCount = await prisma.chartOfAccount.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return badRequestResponse('Cannot delete account with child accounts');
    }

    // Check if account has journal entries
    const journalLinesCount = await prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (journalLinesCount > 0) {
      return badRequestResponse('Cannot delete account with journal entries');
    }

    await prisma.chartOfAccount.delete({
      where: { id },
    });

    return successResponse({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return serverErrorResponse();
  }
}
