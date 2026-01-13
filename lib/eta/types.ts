// Egyptian Tax Authority (ETA) E-Invoice Types

export interface ETACredentials {
  clientId: string;
  clientSecret: string;
  environment: 'preprod' | 'production';
}

export interface ETAToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface ETAIssuer {
  type: 'B' | 'P' | 'F'; // Business, Person, Foreigner
  id: string; // Tax registration number
  name: string;
  address: ETAAddress;
}

export interface ETAReceiver {
  type: 'B' | 'P' | 'F';
  id?: string;
  name: string;
  address?: ETAAddress;
}

export interface ETAAddress {
  branchId?: string;
  country: string; // ISO country code
  governate: string;
  regionCity: string;
  street: string;
  buildingNumber: string;
  postalCode?: string;
  floor?: string;
  room?: string;
  landmark?: string;
  additionalInformation?: string;
}

export interface ETAInvoiceLine {
  description: string;
  itemType: string; // GS1, EGS, etc.
  itemCode: string;
  unitType: string; // EA, KGM, etc.
  quantity: number;
  unitValue: {
    currencySold: string;
    amountEGP: number;
    amountSold?: number;
    currencyExchangeRate?: number;
  };
  salesTotal: number;
  total: number;
  valueDifference?: number;
  totalTaxableFees?: number;
  netTotal: number;
  itemsDiscount?: number;
  discount?: {
    rate: number;
    amount: number;
  };
  taxableItems: ETATaxItem[];
  internalCode?: string;
}

export interface ETATaxItem {
  taxType: string; // T1 (VAT), T2, T3, etc.
  amount: number;
  subType: string;
  rate: number;
}

export interface ETADocument {
  issuer: ETAIssuer;
  receiver: ETAReceiver;
  documentType: 'I' | 'C' | 'D'; // Invoice, Credit Note, Debit Note
  documentTypeVersion: string;
  dateTimeIssued: string; // ISO 8601
  taxpayerActivityCode: string;
  internalId: string;
  purchaseOrderReference?: string;
  purchaseOrderDescription?: string;
  salesOrderReference?: string;
  salesOrderDescription?: string;
  proformaInvoiceNumber?: string;
  payment?: {
    bankName?: string;
    bankAddress?: string;
    bankAccountNo?: string;
    bankAccountIBAN?: string;
    swiftCode?: string;
    terms?: string;
  };
  delivery?: {
    approach?: string;
    packaging?: string;
    dateValidity?: string;
    exportPort?: string;
    grossWeight?: number;
    netWeight?: number;
    terms?: string;
  };
  invoiceLines: ETAInvoiceLine[];
  totalDiscountAmount: number;
  totalSalesAmount: number;
  netAmount: number;
  taxTotals: ETATaxTotal[];
  totalAmount: number;
  extraDiscountAmount?: number;
  totalItemsDiscountAmount?: number;
  signatures?: ETASignature[];
}

export interface ETATaxTotal {
  taxType: string;
  amount: number;
}

export interface ETASignature {
  signatureType: string;
  value: string;
}

export interface ETASubmissionRequest {
  documents: ETADocument[];
}

export interface ETASubmissionResponse {
  submissionId: string;
  acceptedDocuments: Array<{
    uuid: string;
    longId: string;
    internalId: string;
    hashKey: string;
  }>;
  rejectedDocuments: Array<{
    internalId: string;
    error: {
      code: string;
      message: string;
      target?: string;
      details?: Array<{
        code: string;
        message: string;
        propertyPath?: string;
      }>;
    };
  }>;
}

export interface ETADocumentStatus {
  uuid: string;
  status: 'Valid' | 'Invalid' | 'Rejected' | 'Cancelled' | 'Submitted';
  validationResults?: {
    status: string;
    validationSteps: Array<{
      name: string;
      status: string;
      error?: {
        code: string;
        message: string;
      };
    }>;
  };
}

// ETA Tax Types
export const ETA_TAX_TYPES = {
  T1: 'VAT', // ضريبة القيمة المضافة
  T2: 'Table Tax', // ضريبة الجدول
  T3: 'Withholding Tax', // ضريبة الخصم
  T4: 'Entertainment Tax', // رسم التنمية
  T5: 'Stamp Tax', // ضريبة الدمغة
  T6: 'Medical Insurance Tax', // التأمين الصحي
  T7: 'Social Insurance Tax', // التأمين الاجتماعي
  T8: 'Municipal Tax', // ضريبة المحليات
  T9: 'Excise Tax', // ضريبة المبيعات
  T10: 'Export Tax', // ضريبة التصدير
  T11: 'Environmental Tax', // ضريبة البيئة
  T12: 'Service Charges', // رسوم الخدمة
};

// ETA Tax Subtypes for VAT (T1)
export const ETA_VAT_SUBTYPES = {
  V001: 'Export', // صادرات - 0%
  V002: 'Exempt', // معفي
  V003: 'Zero Rate', // نسبة صفر
  V004: 'Standard Rate', // النسبة العادية - 14%
  V005: 'Non-Taxable', // غير خاضع
  V006: 'Exempted', // معفي بموجب القانون
  V007: 'Reduced Rate', // نسبة مخفضة - 5%
  V008: 'Medical Products', // منتجات طبية - 0%
  V009: 'Essential Goods', // سلع أساسية
  V010: 'Agricultural', // زراعي
};

// ETA Unit Types
export const ETA_UNIT_TYPES = {
  EA: 'Each', // قطعة
  KGM: 'Kilogram', // كيلوجرام
  MTR: 'Meter', // متر
  LTR: 'Liter', // لتر
  MTK: 'Square Meter', // متر مربع
  MTQ: 'Cubic Meter', // متر مكعب
  TNE: 'Metric Ton', // طن
  PR: 'Pair', // زوج
  BX: 'Box', // صندوق
  DZ: 'Dozen', // دستة
  SET: 'Set', // طقم
  HR: 'Hour', // ساعة
  DAY: 'Day', // يوم
};

// Document Types
export const ETA_DOCUMENT_TYPES = {
  I: 'Invoice', // فاتورة
  C: 'Credit Note', // إشعار دائن
  D: 'Debit Note', // إشعار مدين
};
