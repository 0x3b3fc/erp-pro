'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Download,
  Printer,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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
  etaStatus: string | null;
  etaUuid: string | null;
  customer: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
    taxNumber: string | null;
  };
}

interface Stats {
  total: number;
  draft: number;
  confirmed: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusConfig: Record<string, { color: string; bgColor: string; darkBgColor: string; icon: any }> = {
  DRAFT: { color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100', darkBgColor: 'dark:bg-slate-500/10', icon: FileText },
  CONFIRMED: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-500/10', icon: CheckCircle },
  SENT: { color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100', darkBgColor: 'dark:bg-indigo-500/10', icon: Send },
  PAID: { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10', icon: CheckCircle },
  PARTIALLY_PAID: { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100', darkBgColor: 'dark:bg-yellow-500/10', icon: Clock },
  OVERDUE: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-500/10', icon: AlertCircle },
  CANCELLED: { color: 'text-slate-500 dark:text-slate-500', bgColor: 'bg-slate-100', darkBgColor: 'dark:bg-slate-500/10', icon: AlertCircle },
};

const etaStatusConfig: Record<string, { color: string; bgColor: string; darkBgColor: string }> = {
  PENDING: { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100', darkBgColor: 'dark:bg-yellow-500/10' },
  SUBMITTED: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-500/10' },
  VALID: { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10' },
  INVALID: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-500/10' },
  REJECTED: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-500/10' },
  CANCELLED: { color: 'text-slate-500 dark:text-slate-500', bgColor: 'bg-slate-100', darkBgColor: 'dark:bg-slate-500/10' },
};

export default function InvoicesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [etaStatusFilter, setEtaStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (etaStatusFilter && etaStatusFilter !== 'all') params.set('etaStatus', etaStatusFilter);

      const res = await fetch(`/api/v1/sales/invoices?${params}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.data.invoices || []);
        setPagination(data.data.pagination);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, etaStatusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!deleteDialog.invoice) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/sales/invoices/${deleteDialog.invoice.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t('common.success'));
        setDeleteDialog({ open: false, invoice: null });
        fetchInvoices();
      } else {
        const data = await res.json();
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitToETA = async (id: string) => {
    try {
      setSubmitting(id);
      const res = await fetch(`/api/v1/sales/invoices/${id}/submit-eta`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isRTL ? 'تم إرسال الفاتورة إلى منظومة الفاتورة الإلكترونية' : 'Invoice submitted to ETA');
        fetchInvoices();
      } else {
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(null);
    }
  };

  const handleCheckETAStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}/eta-status`);
      const data = await res.json();

      if (data.success) {
        toast.success(`${isRTL ? 'حالة ETA' : 'ETA Status'}: ${data.data.status}`);
        fetchInvoices();
      } else {
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-EG');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      DRAFT: { ar: 'مسودة', en: 'Draft' },
      CONFIRMED: { ar: 'مؤكدة', en: 'Confirmed' },
      SENT: { ar: 'مرسلة', en: 'Sent' },
      PAID: { ar: 'مدفوعة', en: 'Paid' },
      PARTIALLY_PAID: { ar: 'مدفوعة جزئياً', en: 'Partially Paid' },
      OVERDUE: { ar: 'متأخرة', en: 'Overdue' },
      CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
    };
    return labels[status]?.[isRTL ? 'ar' : 'en'] || status;
  };

  const getETAStatusLabel = (status: string | null) => {
    if (!status) return null;
    const labels: Record<string, { ar: string; en: string }> = {
      PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
      SUBMITTED: { ar: 'تم الإرسال', en: 'Submitted' },
      VALID: { ar: 'صالحة', en: 'Valid' },
      INVALID: { ar: 'غير صالحة', en: 'Invalid' },
      REJECTED: { ar: 'مرفوضة', en: 'Rejected' },
      CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
    };
    return labels[status]?.[isRTL ? 'ar' : 'en'] || status;
  };

  const getCustomerName = (customer: Invoice['customer']) => {
    return isRTL ? customer.nameAr : (customer.nameEn || customer.nameAr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/20">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            {t('navigation.invoices')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة فواتير المبيعات والفواتير الإلكترونية' : 'Manage sales invoices and e-invoices'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/sales/invoices/new`)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25"
        >
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? 'فاتورة جديدة' : 'New Invoice'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي الفواتير' : 'Total Invoices'}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.total ?? pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'المدفوعة' : 'Paid'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.paid ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'المتأخرة' : 'Overdue'}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats?.overdue ?? 0}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المبيعات' : 'Total Sales'}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(stats?.totalAmount ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isRTL ? 'بحث برقم الفاتورة أو اسم العميل...' : 'Search by invoice number or customer...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="DRAFT">{isRTL ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="CONFIRMED">{isRTL ? 'مؤكدة' : 'Confirmed'}</SelectItem>
                <SelectItem value="SENT">{isRTL ? 'مرسلة' : 'Sent'}</SelectItem>
                <SelectItem value="PAID">{isRTL ? 'مدفوعة' : 'Paid'}</SelectItem>
                <SelectItem value="OVERDUE">{isRTL ? 'متأخرة' : 'Overdue'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={etaStatusFilter} onValueChange={setEtaStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={isRTL ? 'حالة ETA' : 'ETA Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="PENDING">{isRTL ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem value="SUBMITTED">{isRTL ? 'تم الإرسال' : 'Submitted'}</SelectItem>
                <SelectItem value="VALID">{isRTL ? 'صالحة' : 'Valid'}</SelectItem>
                <SelectItem value="REJECTED">{isRTL ? 'مرفوضة' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="secondary" className="bg-slate-100 dark:bg-slate-700">
              <Search className="h-4 w-4 me-2" />
              {t('common.search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Receipt className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('common.noResults')}</p>
              <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على فواتير' : 'No invoices found'}</p>
              <Button
                onClick={() => router.push(`/${locale}/sales/invoices/new`)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 me-2" />
                {isRTL ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.invoiceNumber')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.customer')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.invoiceDate')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.dueDate')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{t('common.total')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'حالة ETA' : 'ETA Status'}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusStyle = statusConfig[invoice.status] || statusConfig.DRAFT;
                    const StatusIcon = statusStyle.icon;

                    return (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/${locale}/sales/invoices/${invoice.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-mono font-medium text-slate-900 dark:text-white">
                              {invoice.invoiceNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {getCustomerName(invoice.customer)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {invoice.customer.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(invoice.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-600 dark:text-slate-300'
                            }`}>
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(invoice.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(invoice.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusStyle.bgColor} ${statusStyle.darkBgColor} ${statusStyle.color} border-0 gap-1`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.etaStatus ? (
                            <Badge
                              className={`${etaStatusConfig[invoice.etaStatus]?.bgColor} ${etaStatusConfig[invoice.etaStatus]?.darkBgColor} ${etaStatusConfig[invoice.etaStatus]?.color} border-0`}
                            >
                              {getETAStatusLabel(invoice.etaStatus)}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/invoices/${invoice.id}`)}>
                                <Eye className="h-4 w-4 me-2" />
                                {isRTL ? 'عرض التفاصيل' : 'View Details'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 me-2" />
                                {isRTL ? 'طباعة' : 'Print'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 me-2" />
                                {isRTL ? 'تحميل PDF' : 'Download PDF'}
                              </DropdownMenuItem>

                              {invoice.status === 'CONFIRMED' && !invoice.etaUuid && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleSubmitToETA(invoice.id)}
                                    disabled={submitting === invoice.id}
                                  >
                                    {submitting === invoice.id ? (
                                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4 me-2" />
                                    )}
                                    {isRTL ? 'إرسال إلى ETA' : 'Submit to ETA'}
                                  </DropdownMenuItem>
                                </>
                              )}

                              {invoice.etaUuid && (
                                <DropdownMenuItem onClick={() => handleCheckETAStatus(invoice.id)}>
                                  <RefreshCw className="h-4 w-4 me-2" />
                                  {isRTL ? 'تحديث حالة ETA' : 'Refresh ETA Status'}
                                </DropdownMenuItem>
                              )}

                              {invoice.status === 'DRAFT' && !invoice.etaUuid && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => setDeleteDialog({ open: true, invoice })}
                                  >
                                    <Trash2 className="h-4 w-4 me-2" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? `عرض ${invoices.length} من ${pagination.total} فاتورة`
              : `Showing ${invoices.length} of ${pagination.total} invoices`
            }
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, invoice: null })}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('common.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {deleteDialog.invoice?.invoiceNumber}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deleteDialog.invoice && getCustomerName(deleteDialog.invoice.customer)}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, invoice: null })}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
