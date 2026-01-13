import { ETADocument, ETAInvoiceLine, ETAIssuer, ETAReceiver } from './types';
import { prisma } from '@/lib/db/prisma';

interface InvoiceWithDetails {
  id: string;
  invoiceNumber: string;
  date: Date;
  subtotal: unknown;
  discountAmount: unknown;
  vatAmount: unknown;
  total: unknown;
  customer: {
    id: string;
    nameAr: string;
    nameEn: string;
    taxNumber: string | null;
    customerType: string;
    address: string | null;
    governorate: string | null;
    city: string | null;
  };
  lines: Array<{
    id: string;
    description: string;
    quantity: unknown;
    unitPrice: unknown;
    discountPercent: unknown;
    discountAmount: unknown;
    vatRate: unknown;
    vatAmount: unknown;
    subtotal: unknown;
    total: unknown;
    etaCode: string | null;
    product: {
      sku: string;
      nameAr: string;
      etaCode: string | null;
      etaUnitType: string | null;
    } | null;
  }>;
  tenant: {
    company: {
      nameAr: string;
      nameEn: string;
      taxNumber: string;
      address: string;
      governorate: string | null;
      city: string | null;
      activityCode: string | null;
      branchId: string | null;
    } | null;
  };
}

// Build ETA document from invoice
export async function buildETADocument(invoiceId: string): Promise<ETADocument> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      lines: {
        include: {
          product: {
            select: {
              sku: true,
              nameAr: true,
              etaItemCode: true,
              etaItemType: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      tenant: {
        include: {
          company: true,
        },
      },
    },
  }) as InvoiceWithDetails | null;

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.tenant.company) {
    throw new Error('Company information not found');
  }

  const company = invoice.tenant.company;

  // Build issuer (the company)
  const issuer: ETAIssuer = {
    type: 'B', // Business
    id: company.taxNumber,
    name: company.nameAr,
    address: {
      branchId: company.branchId || '0',
      country: 'EG',
      governate: company.governorate || 'القاهرة',
      regionCity: company.city || 'القاهرة',
      street: company.address || '',
      buildingNumber: '1',
    },
  };

  // Build receiver (the customer)
  const receiver: ETAReceiver = {
    type: invoice.customer.customerType === 'BUSINESS' ? 'B' : 'P',
    id: invoice.customer.taxNumber || undefined,
    name: invoice.customer.nameAr,
    address: invoice.customer.address ? {
      country: 'EG',
      governate: invoice.customer.governorate || 'القاهرة',
      regionCity: invoice.customer.city || 'القاهرة',
      street: invoice.customer.address,
      buildingNumber: '1',
    } : undefined,
  };

  // Build invoice lines
  const invoiceLines: ETAInvoiceLine[] = invoice.lines.map((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const discountAmount = Number(line.discountAmount);
    const vatRate = Number(line.vatRate);
    const vatAmount = Number(line.vatAmount);
    const subtotal = Number(line.subtotal);
    const total = Number(line.total);
    const netTotal = subtotal - discountAmount;

    return {
      description: line.description,
      itemType: line.etaCode || line.product?.etaCode ? 'EGS' : 'GS1',
      itemCode: line.etaCode || line.product?.etaCode || line.product?.sku || 'EG-DEFAULT',
      unitType: line.product?.etaUnitType || 'EA',
      quantity,
      unitValue: {
        currencySold: 'EGP',
        amountEGP: unitPrice,
      },
      salesTotal: subtotal,
      total,
      netTotal,
      discount: discountAmount > 0 ? {
        rate: Number(line.discountPercent),
        amount: discountAmount,
      } : undefined,
      taxableItems: [
        {
          taxType: 'T1', // VAT
          subType: vatRate === 0 ? 'V003' : 'V004', // Zero rate or Standard rate
          rate: vatRate,
          amount: vatAmount,
        },
      ],
      internalCode: line.product?.sku,
    };
  });

  // Build the document
  const document: ETADocument = {
    issuer,
    receiver,
    documentType: 'I', // Invoice
    documentTypeVersion: '1.0',
    dateTimeIssued: invoice.date.toISOString(),
    taxpayerActivityCode: company.activityCode || '4620', // Default: General trade
    internalId: invoice.invoiceNumber,
    invoiceLines,
    totalDiscountAmount: Number(invoice.discountAmount),
    totalSalesAmount: Number(invoice.subtotal),
    netAmount: Number(invoice.subtotal) - Number(invoice.discountAmount),
    taxTotals: [
      {
        taxType: 'T1',
        amount: Number(invoice.vatAmount),
      },
    ],
    totalAmount: Number(invoice.total),
  };

  return document;
}

// Validate invoice before submission
export function validateForETA(invoice: InvoiceWithDetails): string[] {
  const errors: string[] = [];

  // Check company info
  if (!invoice.tenant.company) {
    errors.push('بيانات الشركة غير مكتملة');
  } else {
    if (!invoice.tenant.company.taxNumber) {
      errors.push('الرقم الضريبي للشركة مطلوب');
    }
    if (!invoice.tenant.company.address) {
      errors.push('عنوان الشركة مطلوب');
    }
  }

  // Check customer info for B2B
  if (invoice.customer.customerType === 'BUSINESS') {
    if (!invoice.customer.taxNumber) {
      errors.push('الرقم الضريبي للعميل مطلوب للشركات');
    }
  }

  // Check invoice lines
  if (invoice.lines.length === 0) {
    errors.push('الفاتورة يجب أن تحتوي على بنود');
  }

  for (const line of invoice.lines) {
    if (!line.etaCode && !line.product?.etaCode) {
      errors.push(`البند "${line.description}" يحتاج كود ETA/GS1`);
    }
  }

  return errors;
}
