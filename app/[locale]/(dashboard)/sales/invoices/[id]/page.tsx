'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Printer,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
  Building,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  subtotal: string;
  discountAmount: string;
  vatAmount: string;
  total: string;
  status: string;
  notes: string | null;
  internalNotes: string | null;
  etaUuid: string | null;
  etaLongId: string | null;
  etaStatus: string | null;
  etaSubmittedAt: string | null;
  etaValidatedAt: string | null;
  etaError: string | null;
  customer: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    taxNumber: string | null;
    address: string | null;
    phone: string | null;
  };
  lines: Array<{
    id: string;
    lineNumber: number;
    description: string;
    quantity: string;
    unitPrice: string;
    discountPercent: string;
    discountAmount: string;
    vatRate: string;
    vatAmount: string;
    subtotal: string;
    total: string;
  }>;
  tenant: {
    company: {
      nameAr: string;
      nameEn: string;
      taxNumber: string;
      address: string;
      phone: string | null;
    } | null;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  SENT: 'default',
  PAID: 'default',
  PARTIALLY_PAID: 'secondary',
  OVERDUE: 'destructive',
  CANCELLED: 'destructive',
};

const etaStatusConfig: Record<string, { color: string; icon: any }> = {
  PENDING: { color: 'secondary', icon: Clock },
  SUBMITTED: { color: 'default', icon: Send },
  VALID: { color: 'default', icon: CheckCircle },
  INVALID: { color: 'destructive', icon: XCircle },
  REJECTED: { color: 'destructive', icon: XCircle },
  CANCELLED: { color: 'destructive', icon: XCircle },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showETADialog, setShowETADialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch invoice
  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      CONFIRMED: 'مؤكدة',
      SENT: 'مرسلة',
      PAID: 'مدفوعة',
      PARTIALLY_PAID: 'مدفوعة جزئياً',
      OVERDUE: 'متأخرة',
      CANCELLED: 'ملغاة',
    };
    return labels[status] || status;
  };

  // Get ETA status label
  const getETAStatusLabel = (status: string | null) => {
    if (!status) return null;
    const labels: Record<string, string> = {
      PENDING: t('eta.pending'),
      SUBMITTED: t('eta.submitted'),
      VALID: t('eta.valid'),
      INVALID: t('eta.invalid'),
      REJECTED: t('eta.rejected'),
      CANCELLED: t('eta.cancelled'),
    };
    return labels[status] || status;
  };

  // Confirm invoice
  const handleConfirm = async () => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      if (res.ok) {
        setShowConfirmDialog(false);
        fetchInvoice();
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  // Submit to ETA
  const handleSubmitToETA = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}/submit-eta`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        setShowETADialog(false);
        fetchInvoice();
        alert(`${t('eta.submitted')}\nUUID: ${data.data.uuid}`);
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Check ETA status
  const handleCheckETAStatus = async () => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}/eta-status`);
      const data = await res.json();

      if (data.success) {
        fetchInvoice();
        alert(`${t('eta.etaStatus')}: ${data.data.status}`);
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <p>{t('errors.notFound')}</p>
      </div>
    );
  }

  const company = invoice.tenant.company;
  const ETAIcon = invoice.etaStatus ? etaStatusConfig[invoice.etaStatus]?.icon : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header - Hidden in print */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">تفاصيل الفاتورة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />
            {t('common.print')}
          </Button>

          {invoice.status === 'DRAFT' && (
            <Button onClick={() => setShowConfirmDialog(true)}>
              <CheckCircle className="h-4 w-4 me-2" />
              تأكيد الفاتورة
            </Button>
          )}

          {invoice.status === 'CONFIRMED' && !invoice.etaUuid && (
            <Button onClick={() => setShowETADialog(true)}>
              <Send className="h-4 w-4 me-2" />
              {t('eta.submitToETA')}
            </Button>
          )}

          {invoice.etaUuid && (
            <Button variant="outline" onClick={handleCheckETAStatus}>
              <RefreshCw className="h-4 w-4 me-2" />
              تحديث حالة ETA
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards - Hidden in print */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حالة الفاتورة</p>
                <Badge variant={statusColors[invoice.status] as any} className="mt-1">
                  {getStatusLabel(invoice.status)}
                </Badge>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حالة ETA</p>
                {invoice.etaStatus ? (
                  <Badge
                    variant={etaStatusConfig[invoice.etaStatus]?.color as any}
                    className="mt-1"
                  >
                    {getETAStatusLabel(invoice.etaStatus)}
                  </Badge>
                ) : (
                  <p className="text-sm mt-1">لم يتم الإرسال</p>
                )}
              </div>
              {ETAIcon && <ETAIcon className="h-8 w-8 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الاستحقاق</p>
                <p className="font-medium mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفاتورة</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(invoice.total)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETA Error Alert */}
      {invoice.etaError && (
        <Card className="border-destructive bg-destructive/10 print:hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{t('eta.etaError')}</p>
                <p className="text-sm mt-1">{invoice.etaError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Content - Printable */}
      <div className="print:p-0">
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-6">
              <div>
                {company && (
                  <>
                    <h2 className="text-2xl font-bold">{company.nameAr}</h2>
                    <p className="text-muted-foreground">{company.nameEn}</p>
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">الرقم الضريبي:</span>{' '}
                      {company.taxNumber}
                    </p>
                    <p className="text-sm">{company.address}</p>
                    {company.phone && <p className="text-sm">{company.phone}</p>}
                  </>
                )}
              </div>
              <div className="text-end">
                <h1 className="text-3xl font-bold text-primary">فاتورة مبيعات</h1>
                <p className="text-xl font-medium mt-2">{invoice.invoiceNumber}</p>
                <p className="text-sm mt-2">
                  <span className="text-muted-foreground">التاريخ:</span>{' '}
                  {formatDate(invoice.date)}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">تاريخ الاستحقاق:</span>{' '}
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  العميل
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">{invoice.customer.nameAr}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customer.nameEn}</p>
                  <p className="text-sm mt-2">الكود: {invoice.customer.code}</p>
                  {invoice.customer.taxNumber && (
                    <p className="text-sm">الرقم الضريبي: {invoice.customer.taxNumber}</p>
                  )}
                  {invoice.customer.address && (
                    <p className="text-sm">{invoice.customer.address}</p>
                  )}
                  {invoice.customer.phone && (
                    <p className="text-sm">{invoice.customer.phone}</p>
                  )}
                </div>
              </div>

              {/* ETA Info */}
              {invoice.etaUuid && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    بيانات الفاتورة الإلكترونية
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">UUID:</span>{' '}
                      <span className="font-mono text-xs">{invoice.etaUuid}</span>
                    </p>
                    {invoice.etaLongId && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Long ID:</span>{' '}
                        <span className="font-mono text-xs">{invoice.etaLongId}</span>
                      </p>
                    )}
                    {invoice.etaSubmittedAt && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">تاريخ الإرسال:</span>{' '}
                        {new Date(invoice.etaSubmittedAt).toLocaleString('ar-EG')}
                      </p>
                    )}
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2 print:hidden">
                      <ExternalLink className="h-3 w-3 me-1" />
                      عرض على بوابة ETA
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Lines */}
            <div className="border rounded-lg overflow-hidden mb-8">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('sales.description')}</TableHead>
                    <TableHead className="text-center">{t('common.quantity')}</TableHead>
                    <TableHead className="text-end">{t('sales.unitPrice')}</TableHead>
                    <TableHead className="text-center">{t('common.discount')}</TableHead>
                    <TableHead className="text-center">{t('common.vat')}</TableHead>
                    <TableHead className="text-end">{t('common.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{line.description}</TableCell>
                      <TableCell className="text-center">{Number(line.quantity)}</TableCell>
                      <TableCell className="text-end">{formatCurrency(line.unitPrice)}</TableCell>
                      <TableCell className="text-center">
                        {Number(line.discountPercent) > 0
                          ? `${Number(line.discountPercent)}%`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">{Number(line.vatRate)}%</TableCell>
                      <TableCell className="text-end font-medium">
                        {formatCurrency(line.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="text-start">
                      {t('common.subtotal')}
                    </TableCell>
                    <TableCell className="text-end">{formatCurrency(invoice.subtotal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} className="text-start">
                      {t('common.discount')}
                    </TableCell>
                    <TableCell className="text-end text-destructive">
                      -{formatCurrency(invoice.discountAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} className="text-start">
                      {t('common.vat')}
                    </TableCell>
                    <TableCell className="text-end">{formatCurrency(invoice.vatAmount)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary text-primary-foreground">
                    <TableCell colSpan={6} className="text-start font-bold text-lg">
                      {t('common.total')}
                    </TableCell>
                    <TableCell className="text-end font-bold text-lg">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">{t('sales.notes')}</h3>
                <p className="text-sm bg-muted/50 p-4 rounded-lg">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>شكراً لتعاملكم معنا</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الفاتورة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تأكيد هذه الفاتورة؟ بعد التأكيد لا يمكن تعديل الفاتورة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ETA Submit Dialog */}
      <Dialog open={showETADialog} onOpenChange={setShowETADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('eta.submitToETA')}</DialogTitle>
            <DialogDescription>
              سيتم إرسال الفاتورة لمنظومة الفاتورة الإلكترونية بمصلحة الضرائب المصرية.
              <br />
              <br />
              تأكد من صحة جميع البيانات قبل الإرسال.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowETADialog(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmitToETA} disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : t('eta.submitToETA')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
