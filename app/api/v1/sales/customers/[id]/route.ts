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

// Validation schema for updating customer
const updateCustomerSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  nameAr: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
  taxNumber: z.string().optional().nullable(),
  commercialRegister: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTermsDays: z.number().min(0).optional(),
  accountId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Get single customer
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

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            total: true,
            status: true,
            etaStatus: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!customer) {
      return notFoundResponse('Customer not found');
    }

    return successResponse(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return serverErrorResponse();
  }
}

// PATCH - Update customer
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tenantId } = await getAuthSession();
    const { id } = await params;

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existingCustomer) {
      return notFoundResponse('Customer not found');
    }

    const body = await request.json();
    const validation = updateCustomerSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // If changing code, check uniqueness
    if (data.code && data.code !== existingCustomer.code) {
      const duplicateCode = await prisma.customer.findFirst({
        where: { tenantId, code: data.code, id: { not: id } },
      });

      if (duplicateCode) {
        return badRequestResponse('Customer code already exists');
      }
    }

    // If accountId provided, verify it exists
    if (data.accountId) {
      const account = await prisma.chartOfAccount.findFirst({
        where: { id: data.accountId, tenantId },
      });
      if (!account) {
        return badRequestResponse('Account not found');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return successResponse(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return serverErrorResponse();
  }
}

// DELETE - Delete customer
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

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      return notFoundResponse('Customer not found');
    }

    // Check if customer has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id },
    });

    if (invoiceCount > 0) {
      return badRequestResponse('Cannot delete customer with invoices');
    }

    await prisma.customer.delete({
      where: { id },
    });

    return successResponse({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return serverErrorResponse();
  }
}
