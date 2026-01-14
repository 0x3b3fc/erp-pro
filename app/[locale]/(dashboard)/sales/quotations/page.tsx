'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    Plus,
    Search,
    FileText,
    Edit,
    Trash2,
    MoreHorizontal,
    Send,
    Copy,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    RefreshCw,
    Loader2,
    Calendar,
    TrendingUp,
    AlertTriangle,
    FileCheck,
    ArrowRight,
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

interface Quotation {
    id: string;
    number: string;
    customer: {
        id: string;
        nameAr: string;
        nameEn: string | null;
    };
    date: string;
    expiryDate: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    itemsCount: number;
}

interface QuotationStats {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalValue: number;
    acceptanceRate: number;
}

const statusConfig: Record<string, { color: string; bgColor: string; darkBgColor: string; icon: any }> = {
    draft: { color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100', darkBgColor: 'dark:bg-slate-500/10', icon: FileText },
    sent: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-500/10', icon: Send },
    accepted: { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10', icon: CheckCircle },
    rejected: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-500/10', icon: XCircle },
    expired: { color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100', darkBgColor: 'dark:bg-orange-500/10', icon: Clock },
};

export default function QuotationsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const isRTL = locale === 'ar';

    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [stats, setStats] = useState<QuotationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; quotation: Quotation | null }>({
        open: false,
        quotation: null,
    });
    const [deleting, setDeleting] = useState(false);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/v1/sales/quotations?${params}`);
            const data = await res.json();

            if (data.success) {
                setQuotations(data.data.quotations || []);
                if (data.data.stats) setStats(data.data.stats);
                if (data.data.pagination) {
                    setPagination({
                        total: data.data.pagination.total,
                        totalPages: data.data.pagination.totalPages,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, [page, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchQuotations();
    };

    const handleDelete = async () => {
        if (!deleteDialog.quotation) return;

        try {
            setDeleting(true);
            const res = await fetch(`/api/v1/sales/quotations/${deleteDialog.quotation.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success(t('common.success'));
                setDeleteDialog({ open: false, quotation: null });
                fetchQuotations();
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

    const handleConvertToInvoice = (id: string) => {
        router.push(`/${locale}/sales/invoices/new?quotationId=${id}`);
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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            draft: { ar: 'مسودة', en: 'Draft' },
            sent: { ar: 'مرسل', en: 'Sent' },
            accepted: { ar: 'مقبول', en: 'Accepted' },
            rejected: { ar: 'مرفوض', en: 'Rejected' },
            expired: { ar: 'منتهي', en: 'Expired' },
        };
        return labels[status]?.[isRTL ? 'ar' : 'en'] || status;
    };

    const getCustomerName = (customer: Quotation['customer']) => {
        return isRTL ? customer.nameAr : (customer.nameEn || customer.nameAr);
    };

    const isExpired = (expiryDate: string) => {
        return new Date(expiryDate) < new Date();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                            <FileCheck className="h-6 w-6 text-white" />
                        </div>
                        {isRTL ? 'عروض الأسعار' : 'Quotations'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isRTL ? 'إدارة عروض الأسعار للعملاء' : 'Manage customer quotations and proposals'}
                    </p>
                </div>
                <Button
                    onClick={() => router.push(`/${locale}/sales/quotations/new`)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/25"
                >
                    <Plus className="h-4 w-4 me-2" />
                    {isRTL ? 'عرض سعر جديد' : 'New Quotation'}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي العروض' : 'Total Quotations'}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    {stats?.total ?? pagination.total}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'المقبولة' : 'Accepted'}</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {stats?.accepted ?? 0}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'معدل القبول' : 'Acceptance Rate'}</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {stats?.acceptanceRate ? `${stats.acceptanceRate.toFixed(1)}%` : '0%'}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي القيمة' : 'Total Value'}</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatCurrency(stats?.totalValue ?? 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                                placeholder={isRTL ? 'بحث برقم العرض أو اسم العميل...' : 'Search by quotation number or customer...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={t('common.status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="draft">{isRTL ? 'مسودة' : 'Draft'}</SelectItem>
                                <SelectItem value="sent">{isRTL ? 'مرسل' : 'Sent'}</SelectItem>
                                <SelectItem value="accepted">{isRTL ? 'مقبول' : 'Accepted'}</SelectItem>
                                <SelectItem value="rejected">{isRTL ? 'مرفوض' : 'Rejected'}</SelectItem>
                                <SelectItem value="expired">{isRTL ? 'منتهي' : 'Expired'}</SelectItem>
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
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : quotations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                            <FileCheck className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('common.noResults')}</p>
                            <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على عروض أسعار' : 'No quotations found'}</p>
                            <Button
                                onClick={() => router.push(`/${locale}/sales/quotations/new`)}
                                className="mt-4"
                                variant="outline"
                            >
                                <Plus className="h-4 w-4 me-2" />
                                {isRTL ? 'إنشاء عرض سعر جديد' : 'Create New Quotation'}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'رقم العرض' : 'Quotation No.'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('sales.customer')}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'العناصر' : 'Items'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{t('common.total')}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotations.map((quotation) => {
                                        const statusStyle = statusConfig[quotation.status] || statusConfig.draft;
                                        const StatusIcon = statusStyle.icon;
                                        const expired = isExpired(quotation.expiryDate) && quotation.status !== 'accepted' && quotation.status !== 'rejected';

                                        return (
                                            <TableRow
                                                key={quotation.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/${locale}/sales/quotations/${quotation.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                                                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                                                            {quotation.number}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {getCustomerName(quotation.customer)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatDate(quotation.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-2 ${expired ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
                                                        }`}>
                                                        {expired && <AlertTriangle className="h-3.5 w-3.5" />}
                                                        <Clock className={`h-3.5 w-3.5 ${expired ? 'hidden' : ''}`} />
                                                        {formatDate(quotation.expiryDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 dark:text-slate-300">{quotation.itemsCount}</span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {formatCurrency(quotation.total)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${statusStyle.bgColor} ${statusStyle.darkBgColor} ${statusStyle.color} border-0 gap-1`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {getStatusLabel(quotation.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/quotations/${quotation.id}`)}>
                                                                <Eye className="h-4 w-4 me-2" />
                                                                {isRTL ? 'عرض التفاصيل' : 'View Details'}
                                                            </DropdownMenuItem>
                                                            {quotation.status === 'draft' && (
                                                                <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/quotations/${quotation.id}/edit`)}>
                                                                    <Edit className="h-4 w-4 me-2" />
                                                                    {t('common.edit')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem>
                                                                <Copy className="h-4 w-4 me-2" />
                                                                {isRTL ? 'نسخ' : 'Duplicate'}
                                                            </DropdownMenuItem>

                                                            {quotation.status === 'accepted' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleConvertToInvoice(quotation.id)}
                                                                        className="text-green-600 dark:text-green-400"
                                                                    >
                                                                        <ArrowRight className="h-4 w-4 me-2" />
                                                                        {isRTL ? 'تحويل إلى فاتورة' : 'Convert to Invoice'}
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}

                                                            {quotation.status === 'draft' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 dark:text-red-400"
                                                                        onClick={() => setDeleteDialog({ open: true, quotation })}
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
                            ? `عرض ${quotations.length} من ${pagination.total} عرض سعر`
                            : `Showing ${quotations.length} of ${pagination.total} quotations`
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
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, quotation: null })}>
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
                                    {deleteDialog.quotation?.number}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {deleteDialog.quotation && getCustomerName(deleteDialog.quotation.customer)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, quotation: null })}
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
