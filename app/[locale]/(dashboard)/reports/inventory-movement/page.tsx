'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Package,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Download,
    Filter,
    Search,
    TrendingUp,
    TrendingDown,
    Calendar,
    Printer,
    Warehouse,
    ArrowLeftRight,
    ClipboardList,
    BoxIcon,
    PackagePlus,
    PackageMinus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Movement {
    id: string;
    date: string;
    productCode: string;
    productName: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    reason: string;
    reference: string;
    warehouse: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    balanceAfter: number;
}

interface MovementSummary {
    totalIn: number;
    totalOut: number;
    netChange: number;
    totalValue: number;
    movementCount: number;
}

export default function InventoryMovementReportPage() {
    const t = useTranslations();
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const [loading, setLoading] = useState(true);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [summary, setSummary] = useState<MovementSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('month');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/reports/inventory-movements?period=${dateRange}&type=${typeFilter}&warehouse=${warehouseFilter}`);
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(locale === 'ar' ? 'غير مصرح. يرجى تسجيل الدخول أولاً.' : 'Unauthorized. Please login first.');
                }
                throw new Error(locale === 'ar' ? 'فشل في جلب بيانات حركة المخزون' : 'Failed to fetch inventory movements');
            }
            const result = await res.json();
            if (result.data) {
                setMovements(result.data.movements || []);
                setSummary(result.data.summary || null);
            } else {
                setMovements(result.movements || []);
                setSummary(result.summary || null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = useCallback(() => {
        if (!movements || movements.length === 0) return;

        const typeLabels: Record<string, { ar: string; en: string }> = {
            in: { ar: 'وارد', en: 'In' },
            out: { ar: 'صادر', en: 'Out' },
            transfer: { ar: 'تحويل', en: 'Transfer' },
            adjustment: { ar: 'تسوية', en: 'Adjustment' },
        };

        const headers = [
            locale === 'ar' ? 'التاريخ' : 'Date',
            locale === 'ar' ? 'كود المنتج' : 'Product Code',
            locale === 'ar' ? 'اسم المنتج' : 'Product Name',
            locale === 'ar' ? 'النوع' : 'Type',
            locale === 'ar' ? 'السبب' : 'Reason',
            locale === 'ar' ? 'المرجع' : 'Reference',
            locale === 'ar' ? 'المستودع' : 'Warehouse',
            locale === 'ar' ? 'الكمية' : 'Quantity',
            locale === 'ar' ? 'تكلفة الوحدة' : 'Unit Cost',
            locale === 'ar' ? 'إجمالي القيمة' : 'Total Value',
            locale === 'ar' ? 'الرصيد بعد' : 'Balance After',
        ];

        const rows: string[][] = [headers];

        movements.forEach(m => {
            rows.push([
                new Date(m.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
                m.productCode,
                m.productName,
                typeLabels[m.type]?.[locale === 'ar' ? 'ar' : 'en'] || m.type,
                m.reason,
                m.reference,
                m.warehouse,
                m.quantity.toString(),
                m.unitCost.toString(),
                m.totalValue.toString(),
                m.balanceAfter.toString(),
            ]);
        });

        // Add summary
        if (summary) {
            rows.push([]);
            rows.push([locale === 'ar' ? 'الملخص' : 'Summary']);
            rows.push([locale === 'ar' ? 'إجمالي الوارد' : 'Total In', summary.totalIn.toString()]);
            rows.push([locale === 'ar' ? 'إجمالي الصادر' : 'Total Out', summary.totalOut.toString()]);
            rows.push([locale === 'ar' ? 'صافي التغيير' : 'Net Change', summary.netChange.toString()]);
            rows.push([locale === 'ar' ? 'إجمالي القيمة' : 'Total Value', summary.totalValue.toString()]);
            rows.push([locale === 'ar' ? 'عدد الحركات' : 'Movement Count', summary.movementCount.toString()]);
        }

        const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-movements-${dateRange}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [movements, summary, locale, dateRange]);

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(num);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getMovementTypeLabel = (type: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            in: { ar: 'وارد', en: 'In' },
            out: { ar: 'صادر', en: 'Out' },
            transfer: { ar: 'تحويل', en: 'Transfer' },
            adjustment: { ar: 'تسوية', en: 'Adjustment' },
        };
        return locale === 'ar' ? labels[type]?.ar : labels[type]?.en;
    };

    const getMovementTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'in':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'out':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'transfer':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'adjustment':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
        }
    };

    const filteredMovements = movements.filter(m => {
        const matchesSearch =
            m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || m.type === typeFilter;
        const matchesWarehouse = warehouseFilter === 'all' || m.warehouse === warehouseFilter;
        return matchesSearch && matchesType && matchesWarehouse;
    });

    const warehouses = Array.from(new Set(movements.map(m => m.warehouse)));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                            <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                {locale === 'ar' ? 'تقرير حركة المخزون' : 'Inventory Movement Report'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {locale === 'ar' ? 'تتبع جميع حركات المخزون' : 'Track all inventory movements'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-4 h-4 mr-1" />
                            {locale === 'ar' ? 'طباعة' : 'Print'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            onClick={exportToCSV}
                            disabled={movements.length === 0}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            {locale === 'ar' ? 'تصدير' : 'Export'}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'بحث' : 'Search'}
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'بحث بالمنتج أو المرجع...' : 'Search by product or reference...'}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="min-w-[140px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'النوع' : 'Type'}
                                </Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                        <SelectItem value="in">{locale === 'ar' ? 'وارد' : 'In'}</SelectItem>
                                        <SelectItem value="out">{locale === 'ar' ? 'صادر' : 'Out'}</SelectItem>
                                        <SelectItem value="transfer">{locale === 'ar' ? 'تحويل' : 'Transfer'}</SelectItem>
                                        <SelectItem value="adjustment">{locale === 'ar' ? 'تسوية' : 'Adjustment'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[150px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'المستودع' : 'Warehouse'}
                                </Label>
                                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                        {warehouses.map(w => (
                                            <SelectItem key={w} value={w}>{w}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[140px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'الفترة' : 'Period'}
                                </Label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">{locale === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                                        <SelectItem value="week">{locale === 'ar' ? 'هذا الأسبوع' : 'This Week'}</SelectItem>
                                        <SelectItem value="month">{locale === 'ar' ? 'هذا الشهر' : 'This Month'}</SelectItem>
                                        <SelectItem value="quarter">{locale === 'ar' ? 'ربع سنوي' : 'Quarter'}</SelectItem>
                                        <SelectItem value="year">{locale === 'ar' ? 'سنوي' : 'Year'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={fetchData}
                                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {locale === 'ar' ? 'تحديث' : 'Refresh'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {error ? (
                    <Card className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
                        <CardContent className="p-6 text-center">
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                            <Button onClick={fetchData} variant="outline" className="mt-4">
                                {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl shadow-emerald-500/25">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-emerald-100 text-xs">
                                                    {locale === 'ar' ? 'إجمالي الوارد' : 'Total In'}
                                                </p>
                                                <p className="text-xl font-bold mt-1">
                                                    {formatNumber(summary.totalIn)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-xl">
                                                <PackagePlus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-xl shadow-red-500/25">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-red-100 text-xs">
                                                    {locale === 'ar' ? 'إجمالي الصادر' : 'Total Out'}
                                                </p>
                                                <p className="text-xl font-bold mt-1">
                                                    {formatNumber(summary.totalOut)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-xl">
                                                <PackageMinus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`border-0 shadow-xl ${summary.netChange >= 0
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
                                    } text-white`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-xs ${summary.netChange >= 0 ? 'text-blue-100' : 'text-amber-100'}`}>
                                                    {locale === 'ar' ? 'صافي التغير' : 'Net Change'}
                                                </p>
                                                <p className="text-xl font-bold mt-1">
                                                    {summary.netChange >= 0 ? '+' : ''}{formatNumber(summary.netChange)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-xl">
                                                {summary.netChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-xl shadow-violet-500/25">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-violet-100 text-xs">
                                                    {locale === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
                                                </p>
                                                <p className="text-lg font-bold mt-1">
                                                    {formatCurrency(summary.totalValue)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-xl">
                                                <BoxIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0 shadow-xl shadow-slate-500/25">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-slate-200 text-xs">
                                                    {locale === 'ar' ? 'عدد الحركات' : 'Movements'}
                                                </p>
                                                <p className="text-xl font-bold mt-1">
                                                    {formatNumber(summary.movementCount)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-xl">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Movements Table */}
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                                            <ArrowLeftRight className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                                                {locale === 'ar' ? 'تفاصيل الحركات' : 'Movement Details'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                                {locale === 'ar'
                                                    ? `${formatNumber(filteredMovements.length)} حركة`
                                                    : `${formatNumber(filteredMovements.length)} movements`
                                                }
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredMovements.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            {locale === 'ar' ? 'لا توجد حركات مخزون' : 'No inventory movements found'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'التاريخ' : 'Date'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'المنتج' : 'Product'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'النوع' : 'Type'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'السبب' : 'Reason'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'المرجع' : 'Reference'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {locale === 'ar' ? 'المستودع' : 'Warehouse'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                                                        {locale === 'ar' ? 'الكمية' : 'Qty'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                                                        {locale === 'ar' ? 'القيمة' : 'Value'}
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                                                        {locale === 'ar' ? 'الرصيد' : 'Balance'}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredMovements.map((movement) => (
                                                    <TableRow
                                                        key={movement.id}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                    >
                                                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                            {formatDate(movement.date)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium text-slate-800 dark:text-slate-200">{movement.productName}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500">{movement.productCode}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`${getMovementTypeBadgeClass(movement.type)} border`}>
                                                                {getMovementTypeLabel(movement.type)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                            {movement.reason}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                                                                {movement.reference}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                            {movement.warehouse}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className={`font-mono font-semibold ${movement.quantity > 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                                                            {formatCurrency(Math.abs(movement.totalValue))}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                            {formatNumber(movement.balanceAfter)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
