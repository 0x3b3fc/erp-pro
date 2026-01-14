'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Users,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

type Customer = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  taxNumber: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  city: string | null;
  creditLimit: number;
  balance: number;
  isActive: boolean;
  _count: {
    invoices: number;
  };
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
  totalReceivables: number;
  totalCreditLimit: number;
};

export default function CustomersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) searchParams.set('search', search);
      if (typeFilter !== 'all') searchParams.set('type', typeFilter);
      if (statusFilter !== 'all') searchParams.set('status', statusFilter);

      const response = await fetch(`/api/v1/sales/customers?${searchParams}`);
      const result = await response.json();

      if (result.data) {
        setCustomers(result.data.customers || []);
        if (result.data.stats) setStats(result.data.stats);
        if (result.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: result.data.pagination.total,
            totalPages: result.data.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, typeFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleDelete = async () => {
    if (!deleteDialog.customer) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/v1/sales/customers/${deleteDialog.customer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('common.success'));
        setDeleteDialog({ open: false, customer: null });
        fetchCustomers();
      } else {
        const result = await response.json();
        toast.error(result.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const getName = (customer: Customer) => {
    return isRTL ? customer.nameAr : (customer.nameEn || customer.nameAr);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            {t('navigation.customers')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة بيانات العملاء والذمم المدينة' : 'Manage customers and receivables'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/sales/customers/new`)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-4 w-4 me-2" />
          {t('common.create')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي العملاء' : 'Total Customers'}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.total ?? pagination.total}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'العملاء النشطين' : 'Active Customers'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.active ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المستحقات' : 'Total Receivables'}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {formatCurrency(stats?.totalReceivables ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي حد الائتمان' : 'Total Credit Limit'}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(stats?.totalCreditLimit ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isRTL ? 'بحث بالاسم أو الكود أو الهاتف...' : 'Search by name, code or phone...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={isRTL ? 'نوع العميل' : 'Customer Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="INDIVIDUAL">{isRTL ? 'فرد' : 'Individual'}</SelectItem>
                <SelectItem value="BUSINESS">{isRTL ? 'شركة' : 'Business'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                <SelectItem value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</SelectItem>
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('common.noResults')}</p>
              <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على عملاء' : 'No customers found'}</p>
              <Button
                onClick={() => router.push(`/${locale}/sales/customers/new`)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 me-2" />
                {isRTL ? 'إضافة عميل جديد' : 'Add New Customer'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.customerCode')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.customerName')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'النوع' : 'Type'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('settings.phone')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.creditLimit')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'الرصيد' : 'Balance'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('navigation.invoices')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/${locale}/sales/customers/${customer.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {customer.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${customer.customerType === 'BUSINESS'
                            ? 'bg-blue-50 dark:bg-blue-500/10'
                            : 'bg-purple-50 dark:bg-purple-500/10'}`}>
                            {customer.customerType === 'BUSINESS'
                              ? <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              : <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{getName(customer)}</p>
                            {customer.email && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={customer.customerType === 'BUSINESS'
                          ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10'}>
                          {customer.customerType === 'BUSINESS'
                            ? (isRTL ? 'شركة' : 'Business')
                            : (isRTL ? 'فرد' : 'Individual')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(customer.phone || customer.mobile) ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Phone className="h-3 w-3" />
                            {customer.phone || customer.mobile}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(customer.creditLimit)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${(customer.balance ?? 0) > 0
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                          }`}>
                          {formatCurrency(customer.balance ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">{customer._count?.invoices ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={customer.isActive
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'}>
                          {customer.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/customers/${customer.id}`)}>
                              <Eye className="h-4 w-4 me-2" />
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/customers/${customer.id}/edit`)}>
                              <Pencil className="h-4 w-4 me-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setDeleteDialog({ open: true, customer })}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? `عرض ${customers.length} من ${pagination.total} عميل`
              : `Showing ${customers.length} of ${pagination.total} customers`
            }
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, customer: null })}>
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
                  {deleteDialog.customer && getName(deleteDialog.customer)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deleteDialog.customer?.code}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, customer: null })}
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
