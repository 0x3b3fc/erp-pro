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
    RefreshCw,
    Printer,
    CreditCard,
    Banknote,
    Landmark,
    CheckCircle,
    Clock,
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
} from "@/components/ui/select";

interface CustomerReceipt {
    id: string;
    number: string;
    customer: {
        id: string;
        nameAr: string;
        nameEn: string | null;
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

export default function ReceiptsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();

    const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
    const [stats, setStats] = useState<ReceiptStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [page, setPage] = useState(1);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (paymentMethodFilter !== 'all') params.set('paymentMethod', paymentMethodFilter);

            const res = await fetch(`/api/v1/sales/receipts?${params}`);
            const data = await res.json();

            if (data.success) {
                setReceipts(data.data.receipts);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
            // Demo data
            setReceipts([
                {
                    id: '1',
                    number: 'REC-2024-001',
                    customer: { id: '1', nameAr: 'شركة الأمل للتجارة', nameEn: 'Al-Amal Trading Co.' },
                    date: '2024-01-15',
                    amount: 51300,
                    paymentMethod: 'bank_transfer',
                    reference: 'TRF-789456',
                    invoiceNumber: 'INV-2024-001',
                    status: 'completed',
                    notes: null,
                },
                {
                    id: '2',
                    number: 'REC-2024-002',
                    customer: { id: '2', nameAr: 'مؤسسة النور', nameEn: 'Al-Noor Est.' },
                    date: '2024-01-14',
                    amount: 25000,
                    paymentMethod: 'cash',
                    reference: null,
                    invoiceNumber: 'INV-2024-002',
                    status: 'completed',
                    notes: 'دفعة جزئية',
                },
                {
                    id: '3',
                    number: 'REC-2024-003',
                    customer: { id: '3', nameAr: 'شركة السلام', nameEn: 'Al-Salam Co.' },
                    date: '2024-01-15',
                    amount: 35000,
                    paymentMethod: 'check',
                    reference: 'CHK-123456',
                    invoiceNumber: null,
                    status: 'pending',
                    notes: 'شيك مؤجل',
                },
            ]);
            setStats({
                total: 45,
                pending: 5,
                completed: 40,
                totalAmount: 1250000,
                todayAmount: 86300,
                monthAmount: 450000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [page, paymentMethodFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchReceipts();
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

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
            case 'bank_transfer': return <Landmark className="h-4 w-4 text-blue-600" />;
            case 'check': return <Receipt className="h-4 w-4 text-purple-600" />;
            case 'credit_card': return <CreditCard className="h-4 w-4 text-orange-600" />;
            default: return <Banknote className="h-4 w-4" />;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, Record<string, string>> = {
            cash: { ar: 'نقدي', en: 'Cash' },
            bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
            check: { ar: 'شيك', en: 'Check' },
            credit_card: { ar: 'بطاقة ائتمان', en: 'Credit Card' },
        };
        return labels[method]?.[locale] || method;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            pending: { label: locale === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
            completed: { label: locale === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' },
            cancelled: { label: locale === 'ar' ? 'ملغي' : 'Cancelled', variant: 'destructive' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Badge variant={config.variant} className={status === 'completed' ? 'bg-green-600' : ''}>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'إيصالات التحصيل' : 'Customer Receipts'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'إدارة المدفوعات الواردة من العملاء'
                            : 'Manage incoming payments from customers'
                        }
                    </p>
                </div>
                <Button onClick={() => router.push(`/${locale}/sales/receipts/new`)}>
                    <Plus className="me-2 h-4 w-4" />
                    {locale === 'ar' ? 'إيصال جديد' : 'New Receipt'}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'إجمالي الإيصالات' : 'Total Receipts'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                {locale === 'ar' ? 'معلق' : 'Pending'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {locale === 'ar' ? 'مكتمل' : 'Completed'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'تحصيلات اليوم' : "Today's Receipts"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(stats.todayAmount)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'تحصيلات الشهر' : "Month's Receipts"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(stats.monthAmount)}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {locale === 'ar' ? 'إجمالي التحصيلات' : 'Total Collected'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-primary">{formatCurrency(stats.totalAmount)}</div>
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
                                placeholder={locale === 'ar' ? 'بحث برقم الإيصال أو اسم العميل...' : 'Search by receipt number or customer...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-9"
                            />
                        </form>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل الطرق' : 'All Methods'}</SelectItem>
                                <SelectItem value="cash">{locale === 'ar' ? 'نقدي' : 'Cash'}</SelectItem>
                                <SelectItem value="bank_transfer">{locale === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                                <SelectItem value="check">{locale === 'ar' ? 'شيك' : 'Check'}</SelectItem>
                                <SelectItem value="credit_card">{locale === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchReceipts}>
                            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                            {locale === 'ar' ? 'تحديث' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Receipts Table */}
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
                                    <TableHead>{locale === 'ar' ? 'رقم الإيصال' : 'Receipt No.'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'المرجع' : 'Reference'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الفاتورة' : 'Invoice'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receipts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لا توجد إيصالات' : 'No receipts found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    receipts.map((receipt) => (
                                        <TableRow key={receipt.id}>
                                            <TableCell className="font-mono font-medium">{receipt.number}</TableCell>
                                            <TableCell>
                                                {locale === 'ar' ? receipt.customer.nameAr : receipt.customer.nameEn || receipt.customer.nameAr}
                                            </TableCell>
                                            <TableCell>{formatDate(receipt.date)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentMethodIcon(receipt.paymentMethod)}
                                                    {getPaymentMethodLabel(receipt.paymentMethod)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {receipt.reference || '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {receipt.invoiceNumber || '-'}
                                            </TableCell>
                                            <TableCell className="font-medium text-green-600">{formatCurrency(receipt.amount)}</TableCell>
                                            <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/${locale}/sales/receipts/${receipt.id}`)}>
                                                            <Eye className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'عرض' : 'View'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Printer className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'طباعة' : 'Print'}
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
