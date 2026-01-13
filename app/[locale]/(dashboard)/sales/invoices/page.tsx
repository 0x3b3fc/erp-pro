'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, Filter, FileText, Send, Eye, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    nameEn: string;
    taxNumber: string | null;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

const etaStatusColors: Record<string, string> = {
  PENDING: 'secondary',
  SUBMITTED: 'default',
  VALID: 'default',
  INVALID: 'destructive',
  REJECTED: 'destructive',
  CANCELLED: 'destructive',
};

export default function InvoicesPage() {
  const t = useTranslations();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [etaStatusFilter, setEtaStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

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
        setInvoices(data.data.invoices);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const handleSubmitToETA = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}/submit-eta`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        alert(t('eta.submitted') + ': ' + data.data.uuid);
        fetchInvoices();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const handleCheckETAStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/invoices/${id}/eta-status`);
      const data = await res.json();

      if (data.success) {
        alert(`${t('eta.etaStatus')}: ${data.data.status}`);
        fetchInvoices();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('navigation.invoices')}</h1>
          <p className="text-muted-foreground">
            إدارة فواتير المبيعات والفواتير الإلكترونية
          </p>
        </div>
        <Button onClick={() => router.push('/sales/invoices/new')}>
          <Plus className="h-4 w-4 me-2" />
          {t('sales.invoice')} جديدة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="DRAFT">مسودة</SelectItem>
            <SelectItem value="CONFIRMED">مؤكدة</SelectItem>
            <SelectItem value="SENT">مرسلة</SelectItem>
            <SelectItem value="PAID">مدفوعة</SelectItem>
            <SelectItem value="OVERDUE">متأخرة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={etaStatusFilter} onValueChange={setEtaStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('eta.etaStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="PENDING">{t('eta.pending')}</SelectItem>
            <SelectItem value="SUBMITTED">{t('eta.submitted')}</SelectItem>
            <SelectItem value="VALID">{t('eta.valid')}</SelectItem>
            <SelectItem value="REJECTED">{t('eta.rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sales.invoiceNumber')}</TableHead>
              <TableHead>{t('sales.customer')}</TableHead>
              <TableHead>{t('sales.invoiceDate')}</TableHead>
              <TableHead>{t('sales.dueDate')}</TableHead>
              <TableHead className="text-end">{t('common.total')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('eta.etaStatus')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {invoice.invoiceNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customer.nameAr}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-end font-medium">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[invoice.status] as any}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.etaStatus ? (
                      <Badge variant={etaStatusColors[invoice.etaStatus] as any}>
                        {getETAStatusLabel(invoice.etaStatus)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
                        >
                          <Eye className="h-4 w-4 me-2" />
                          عرض
                        </DropdownMenuItem>

                        {invoice.status === 'CONFIRMED' && !invoice.etaUuid && (
                          <DropdownMenuItem
                            onClick={() => handleSubmitToETA(invoice.id)}
                          >
                            <Send className="h-4 w-4 me-2" />
                            {t('eta.submitToETA')}
                          </DropdownMenuItem>
                        )}

                        {invoice.etaUuid && (
                          <DropdownMenuItem
                            onClick={() => handleCheckETAStatus(invoice.id)}
                          >
                            <RefreshCw className="h-4 w-4 me-2" />
                            تحديث حالة ETA
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {invoice.status === 'DRAFT' && !invoice.etaUuid && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            عرض {invoices.length} من {pagination.total} فاتورة
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
