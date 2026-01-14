'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    Plus,
    Search,
    Receipt,
    Edit,
    Trash2,
    MoreHorizontal,
    Eye,
    Printer,
    CreditCard,
    Banknote,
    Landmark,
    CheckCircle,
    Clock,
    Loader2,
    Calendar,
    TrendingUp,
    DollarSign,
    FileText,
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

interface CustomerReceipt {
    id: string;
    number: string;
    customer: {
        id: string;
        nameAr: string;
        nameEn: string | null;
        code: string;
    };
    date: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
    reference: string | null;
    invoiceNumber: string | null;
    status: 'pending' | 'completed' | 'cancelled';
    notes: string | null;
}

interface ReceiptStats {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
    todayAmount: number;
    monthAmount: number;
}

const statusConfig: Record<string, { color: string; bgColor: string; darkBgColor: string; icon: any }> = {
    pending: { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100', darkBgColor: 'dark:bg-yellow-500/10', icon: Clock },
    completed: { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10', icon: CheckCircle },
    cancelled: { color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100', darkBgColor: 'dark:bg-slate-500/10', icon: Clock },
};

const paymentMethodConfig: Record<string, { icon: any; color: string; bgColor: string; darkBgColor: string }> = {
    cash: { icon: Banknote, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10' },
    bank_transfer: { icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-500/10' },
    check: { icon: Receipt, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100', darkBgColor: 'dark:bg-purple-500/10' },
    credit_card: { icon: CreditCard, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100', darkBgColor: 'dark:bg-orange-500/10' },
};

export default function ReceiptsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const isRTL = locale === 'ar';

    const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
    const [stats, setStats] = useState<ReceiptStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; receipt: CustomerReceipt | null }>({
        open: false,
        receipt: null,
    });
    const [deleting, setDeleting] = useState(false);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (paymentMethodFilter !== 'all') params.set('paymentMethod', paymentMethodFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/v1/sales/receipts?${params}`);
            const data = await res.json();

            if (data.success) {
                setReceipts(data.data.receipts || []);
                if (data.data.stats) setStats(data.data.stats);
                if (data.data.pagination) {
                    setPagination({
                        total: data.data.pagination.total,
                        totalPages: data.data.pagination.totalPages,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [page, paymentMethodFilter, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchReceipts();
    };

    const handleDelete = async () => {
        if (!deleteDialog.receipt) return;

        try {
            setDeleting(true);
            const res = await fetch(`/api/v1/sales/receipts/${deleteDialog.receipt.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success(t('common.success'));
                setDeleteDialog({ open: false, receipt: null });
                fetchReceipts();
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-EG');
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            cash: { ar: 'نقدي', en: 'Cash' },
            bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
            check: { ar: 'شيك', en: 'Check' },
            credit_card: { ar: 'بطاقة ائتمان', en: 'Credit Card' },
        };
        return labels[method]?.[isRTL ? 'ar' : 'en'] || method;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            pending: { ar: 'قيد الانتظار', en: 'Pending' },
            completed: { ar: 'مكتمل', en: 'Completed' },
            cancelled: { ar: 'ملغي', en: 'Cancelled' },
        };
        return labels[status]?.[isRTL ? 'ar' : 'en'] || status;
    };

    const getCustomerName = (customer: CustomerReceipt['customer']) => {
        return isRTL ? customer.nameAr : (customer.nameEn || customer.nameAr);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        {isRTL ? 'سندات القبض' : 'Customer Receipts'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isRTL ? 'إدارة مقبوضات العملاء والمدفوعات' : 'Manage customer payments and collections'}
                    </p>
                </div>
                <Button
                    onClick={() => router.push(`/${locale}/sales/receipts/new`)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/25"
                >
                    <Plus className="h-4 w-4 me-2" />
                    {isRTL ? 'سند قبض جديد' : 'New Receipt'}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي السندات' : 'Total Receipts'}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    {stats?.total ?? pagination.total}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'مقبوضات اليوم' : "Today's Collections"}</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(stats?.todayAmount ?? 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'مقبوضات الشهر' : 'This Month'}</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {formatCurrency(stats?.monthAmount ?? 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المقبوضات' : 'Total Collections'}</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatCurrency(stats?.totalAmount ?? 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                                <Banknote className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                                placeholder={isRTL ? 'بحث برقم السند أو اسم العميل...' : 'Search by receipt number or customer...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={isRTL ? 'طريقة الدفع' : 'Payment Method'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="cash">{isRTL ? 'نقدي' : 'Cash'}</SelectItem>
                                <SelectItem value="bank_transfer">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                                <SelectItem value="check">{isRTL ? 'شيك' : 'Check'}</SelectItem>
                                <SelectItem value="credit_card">{isRTL ? 'بطاقة ائتمان' : 'Credit Card'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={t('common.status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="pending">{isRTL ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                                <SelectItem value="completed">{isRTL ? 'مكتمل' : 'Completed'}</SelectItem>
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
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : receipts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                            <Receipt className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('common.noResults')}</p>
                            <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على سندات قبض' : 'No receipts found'}</p>
                            <Button
                                onClick={() => router.push(`/${locale}/sales/receipts/new`)}
                                className="mt-4"
                                variant="outline"
                            >
                                <Plus className="h-4 w-4 me-2" />
                                {isRTL ? 'إنشاء سند قبض جديد' : 'Create New Receipt'}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'رقم السند' : 'Receipt No.'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.customer')}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'رقم الفاتورة' : 'Invoice No.'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receipts.map((receipt) => {
                                        const statusStyle = statusConfig[receipt.status] || statusConfig.pending;
                                        const StatusIcon = statusStyle.icon;
                                        const paymentStyle = paymentMethodConfig[receipt.paymentMethod] || paymentMethodConfig.cash;
                                        const PaymentIcon = paymentStyle.icon;

                                        return (
                                            <TableRow
                                                key={receipt.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/${locale}/sales/receipts/${receipt.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                                            <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                                                            {receipt.number}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {getCustomerName(receipt.customer)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {receipt.customer.code}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatDate(receipt.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                                        {formatCurrency(receipt.amount)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${paymentStyle.bgColor} ${paymentStyle.darkBgColor}`}>
                                                            <PaymentIcon className={`h-3.5 w-3.5 ${paymentStyle.color}`} />
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {getPaymentMethodLabel(receipt.paymentMethod)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {receipt.invoiceNumber ? (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            {receipt.invoiceNumber}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${statusStyle.bgColor} ${statusStyle.darkBgColor} ${statusStyle.color} border-0 gap-1`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {getStatusLabel(receipt.status)}
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
                                                            <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/receipts/${receipt.id}`)}>
                                                                <Eye className="h-4 w-4 me-2" />
                                                                {isRTL ? 'عرض التفاصيل' : 'View Details'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Printer className="h-4 w-4 me-2" />
                                                                {isRTL ? 'طباعة' : 'Print'}
                                                            </DropdownMenuItem>

                                                            {receipt.status === 'pending' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 dark:text-red-400"
                                                                        onClick={() => setDeleteDialog({ open: true, receipt })}
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
            {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isRTL
                            ? `عرض ${receipts.length} من ${pagination.total} سند قبض`
                            : `Showing ${receipts.length} of ${pagination.total} receipts`
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
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, receipt: null })}>
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
                                    {deleteDialog.receipt?.number}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {deleteDialog.receipt && getCustomerName(deleteDialog.receipt.customer)} - {deleteDialog.receipt && formatCurrency(deleteDialog.receipt.amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, receipt: null })}
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
