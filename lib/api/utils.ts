import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export type ApiError = {
  error: string;
  code?: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Get authenticated session and tenant info
export async function getAuthSession() {
  const session = await auth();

  if (!session?.user) {
    return { session: null, tenantId: null };
  }

  return {
    session,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    userRole: session.user.role,
  };
}

// Unauthorized response
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

// Not found response
export function notFoundResponse(message = 'Resource not found') {
  return NextResponse.json(
    { error: message, code: 'NOT_FOUND' },
    { status: 404 }
  );
}

// Bad request response
export function badRequestResponse(message: string) {
  return NextResponse.json(
    { error: message, code: 'BAD_REQUEST' },
    { status: 400 }
  );
}

// Server error response
export function serverErrorResponse(message = 'Internal server error') {
  return NextResponse.json(
    { error: message, code: 'SERVER_ERROR' },
    { status: 500 }
  );
}

// Success response
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

// Created response
export function createdResponse<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

// Parse pagination params
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Build pagination response
export function buildPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Get current fiscal year for tenant
export async function getCurrentFiscalYear(tenantId: string) {
  const now = new Date();

  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      tenantId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  return fiscalYear;
}
