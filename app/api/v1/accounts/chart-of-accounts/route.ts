import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  createdResponse,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api/utils';
import { z } from 'zod';

// Validation schema for creating/updating account
const accountSchema = z.object({
  code: z.string().min(1).max(20),
  nameAr: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().optional().nullable(),
  isHeader: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// GET - List all accounts (with tree structure option)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const tree = searchParams.get('tree') === 'true';
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const headersOnly = searchParams.get('headersOnly') === 'true';

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (type) {
      where.accountType = type;
    }

    if (headersOnly) {
      where.isHeader = true;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tree) {
      // Get all accounts and build tree structure
      const accounts = await prisma.chartOfAccount.findMany({
        where: { tenantId },
        orderBy: { code: 'asc' },
      });

      // Build tree
      const accountMap = new Map();
      const rootAccounts: (typeof accounts[0] & { children: unknown[] })[] = [];

      accounts.forEach(account => {
        accountMap.set(account.id, { ...account, children: [] });
      });

      accounts.forEach(account => {
        if (account.parentId && accountMap.has(account.parentId)) {
          accountMap.get(account.parentId).children.push(accountMap.get(account.id));
        } else if (!account.parentId) {
          rootAccounts.push(accountMap.get(account.id));
        }
      });

      return successResponse(rootAccounts);
    }

    // Paginated list
    const [accounts, total] = await Promise.all([
      prisma.chartOfAccount.findMany({
        where,
        include: {
          parent: {
            select: { id: true, code: true, nameAr: true, nameEn: true },
          },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.chartOfAccount.count({ where }),
    ]);

    return successResponse({
      accounts,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return serverErrorResponse();
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = accountSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Check if code already exists for this tenant
    const existingAccount = await prisma.chartOfAccount.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingAccount) {
      return badRequestResponse('Account code already exists');
    }

    // If parentId is provided, validate it exists and belongs to tenant
    if (data.parentId) {
      const parentAccount = await prisma.chartOfAccount.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parentAccount) {
        return badRequestResponse('Parent account not found');
      }

      // Parent must be a header account
      if (!parentAccount.isHeader) {
        return badRequestResponse('Parent account must be a header account');
      }
    }

    // Calculate level based on parent
    let level = 1;
    if (data.parentId) {
      const parent = await prisma.chartOfAccount.findUnique({
        where: { id: data.parentId },
        select: { level: true },
      });
      level = (parent?.level || 0) + 1;
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        tenantId,
        code: data.code,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        accountType: data.accountType,
        parentId: data.parentId,
        isHeader: data.isHeader,
        isActive: data.isActive,
        level,
      },
    });

    return createdResponse(account);
  } catch (error) {
    console.error('Error creating account:', error);
    return serverErrorResponse();
  }
}
