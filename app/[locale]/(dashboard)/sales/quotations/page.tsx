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
}

export default function QuotationsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();

    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [stats, setStats] = useState<QuotationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

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
                setQuotations(data.data.quotations);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
            // Demo data
            setQuotations([
                {
                    id: '1',
                    number: 'QT-2024-001',
                    customer: { id: '1', nameAr: 'شركة الأمل للتجارة', nameEn: 'Al-Amal Trading Co.' },
                    date: '2024-01-15',
                    expiryDate: '2024-01-30',
                    subtotal: 45000,
                    vatAmount: 6300,
                    total: 51300,
                    status: 'sent',
                    itemsCount: 5,
                },
                {
                    id: '2',
                    number: 'QT-2024-002',
                    customer: { id: '2', nameAr: 'مؤسسة النور', nameEn: 'Al-Noor Est.' },
                    date: '2024-01-14',
                    expiryDate: '2024-01-29',
                    subtotal: 28000,
                    vatAmount: 3920,
                    total: 31920,
                    status: 'accepted',
                    itemsCount: 3,
                },
                {
                    id: '3',
                    number: 'QT-2024-003',
                    customer: { id: '3', nameAr: 'شركة السلام', nameEn: 'Al-Salam Co.' },
                    date: '2024-01-10',
                    expiryDate: '2024-01-12',
                    subtotal: 15000,
                    vatAmount: 2100,
                    total: 17100,
                    status: 'expired',
                    itemsCount: 2,
                },
            ]);
            setStats({
                total: 15,
                draft: 3,
                sent: 5,
                accepted: 4,
                rejected: 1,
                expired: 2,
                totalValue: 350000,
            });
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG');
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: locale === 'ar' ? 'مسودة' : 'Draft', variant: 'secondary' },
            sent: { label: locale === 'ar' ? 'مرسل' : 'Sent', variant: 'default' },
            accepted: { label: locale === 'ar' ? 'مقبول' : 'Accepted', variant: 'default' },
            rejected: { label: locale === 'ar' ? 'مرفوض' : 'Rejected', variant: 'destructive' },
            expired: { label: locale === 'ar' ? 'منتهي' : 'Expired', variant: 'outline' },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <Badge variant={config.variant} className={status === 'accepted' ? 'bg-green-600' : ''}>
                {config.label}
            </Badge>
        );
    };

    const handleConvertToInvoice = async (id: string) => {
        router.push(`/${locale}/sales/invoices/new?quotationId=${id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'عروض الأسعار' : 'Quotations'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'إدارة عروض الأسعار للعملاء'
                            : 'Manage customer quotations'
                        }
                    </p>
                </div>
                <Button onClick={() => router.push(`/${locale}/sales/quotations/new`)}>
                    <Plus className="me-2 h-4 w-4" />
                    {locale === 'ar' ? 'عرض سعر جديد' : 'New Quotation'}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'الإجمالي' : 'Total'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('draft')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {locale === 'ar' ? 'مسودة' : 'Draft'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.draft}</div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('sent')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Send className="h-4 w-4 text-blue-600" />
                                {locale === 'ar' ? 'مرسل' : 'Sent'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('accepted')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {locale === 'ar' ? 'مقبول' : 'Accepted'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('rejected')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                {locale === 'ar' ? 'مرفوض' : 'Rejected'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'القيمة الإجمالية' : 'Total Value'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(stats.totalValue)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Filter */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={locale === 'ar' ? 'بحث برقم العرض أو اسم العميل...' : 'Search by number or customer...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-9"
                            />
                        </form>
                        <div className="flex gap-2">
                            {['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? (locale === 'ar' ? 'الكل' : 'All') :
                                        status === 'draft' ? (locale === 'ar' ? 'مسودة' : 'Draft') :
                                            status === 'sent' ? (locale === 'ar' ? 'مرسل' : 'Sent') :
                                                status === 'accepted' ? (locale === 'ar' ? 'مقبول' : 'Accepted') :
                                                    status === 'rejected' ? (locale === 'ar' ? 'مرفوض' : 'Rejected') :
                                                        locale === 'ar' ? 'منتهي' : 'Expired'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quotations Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{locale === 'ar' ? 'رقم العرض' : 'Quote No.'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'البنود' : 'Items'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لا توجد عروض أسعار' : 'No quotations found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.map((quotation) => (
                                        <TableRow key={quotation.id}>
                                            <TableCell className="font-mono font-medium">{quotation.number}</TableCell>
                                            <TableCell>
                                                {locale === 'ar' ? quotation.customer.nameAr : quotation.customer.nameEn || quotation.customer.nameAr}
                                            </TableCell>
                                            <TableCell>{formatDate(quotation.date)}</TableCell>
                                            <TableCell>
                                                <span className={new Date(quotation.expiryDate) < new Date() ? 'text-red-600' : ''}>
                                                    {formatDate(quotation.expiryDate)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{quotation.itemsCount}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(quotation.total)}</TableCell>
                                            <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/quotations/${quotation.id}`)}>
                                                            <Eye className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'عرض' : 'View'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/quotations/${quotation.id}/edit`)}>
                                                            <Edit className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleConvertToInvoice(quotation.id)}>
                                                            <Copy className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'تحويل لفاتورة' : 'Convert to Invoice'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'حذف' : 'Delete'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
