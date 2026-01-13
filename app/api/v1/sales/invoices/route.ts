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
  getCurrentFiscalYear,
} from '@/lib/api/utils';
import { z } from 'zod';

// Validation schema for invoice line
const invoiceLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  vatRate: z.number().min(0).default(14), // Egypt VAT is 14%
  etaCode: z.string().optional(), // GS1/EGS code for ETA
});

// Validation schema for creating invoice
const invoiceSchema = z.object({
  customerId: z.string().min(1),
  date: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1),
});

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAuthSession();

    if (!tenantId) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');
    const etaStatus = searchParams.get('etaStatus');
    const customerId = searchParams.get('customerId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    }

    if (etaStatus) {
      where.etaStatus = etaStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (fromDate) {
      where.date = { ...(where.date as object || {}), gte: new Date(fromDate) };
    }

    if (toDate) {
      where.date = { ...(where.date as object || {}), lte: new Date(toDate) };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { nameAr: { contains: search, mode: 'insensitive' } } },
        { customer: { nameEn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: { id: true, code: true, nameAr: true, nameEn: true, taxNumber: true },
          },
          lines: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              total: true,
            },
          },
          _count: {
            select: { lines: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return successResponse({
      invoices,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return serverErrorResponse();
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await getAuthSession();

    if (!tenantId || !userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = invoiceSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const data = validation.data;

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      return badRequestResponse('Customer not found');
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalVat = 0;

    const processedLines = data.lines.map((line) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = lineSubtotal * (line.discountPercent / 100);
      const lineAfterDiscount = lineSubtotal - lineDiscount;
      const lineVat = lineAfterDiscount * (line.vatRate / 100);
      const lineTotal = lineAfterDiscount + lineVat;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalVat += lineVat;

      return {
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountRate: line.discountPercent,
        taxCode: 'T1',
        taxRate: line.vatRate,
        taxAmount: lineVat,
        total: lineTotal,
      };
    });

    const total = subtotal - totalDiscount + totalVat;

    // Generate invoice number
    const currentYear = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: { startsWith: `INV-${currentYear}` },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

    // Create invoice with lines
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: data.customerId,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(data.date),
        subtotal,
        discountAmount: totalDiscount,
        vatAmount: totalVat,
        total,
        notes: data.notes,
        internalNotes: data.internalNotes,
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: processedLines,
        },
      },
      include: {
        customer: {
          select: { id: true, code: true, nameAr: true, nameEn: true, taxNumber: true },
        },
        lines: true,
      },
    });

    return createdResponse(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return serverErrorResponse();
  }
}
