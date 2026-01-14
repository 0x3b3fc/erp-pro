'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Users,
    Truck,
    RefreshCw,
    Download,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type ReportType = 'ar' | 'ap';

interface AgingBucket {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
}

interface AgingItem {
    id: string;
    name: string;
    code: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
}

interface AgingData {
    summary: AgingBucket;
    items: AgingItem[];
}

// Export to CSV function
const exportToCSV = (data: AgingData, reportType: string, locale: string) => {
    if (!data || !data.items.length) return;

    const headers = locale === 'ar'
        ? ['الكود', 'الاسم', 'جاري', '1-30 يوم', '31-60 يوم', '61-90 يوم', 'أكثر من 90 يوم', 'الإجمالي']
        : ['Code', 'Name', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days', 'Total'];

    const rows = data.items.map(item => [
        item.code,
        item.name,
        item.current.toFixed(2),
        item.days1to30.toFixed(2),
        item.days31to60.toFixed(2),
        item.days61to90.toFixed(2),
        item.over90.toFixed(2),
        item.total.toFixed(2),
    ]);

    // Add summary row
    rows.push([
        '',
        locale === 'ar' ? 'الإجمالي' : 'Total',
        data.summary.current.toFixed(2),
        data.summary.days1to30.toFixed(2),
        data.summary.days31to60.toFixed(2),
        data.summary.days61to90.toFixed(2),
        data.summary.over90.toFixed(2),
        data.summary.total.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aging-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

export default function AgingReportPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<ReportType>('ar');
    const [data, setData] = useState<AgingData | null>(null);
    const [sortField, setSortField] = useState<string>('total');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/reports/aging?type=${reportType}`);
            const result = await res.json();

            if (res.status === 401) {
                setError(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
                setData(null);
                return;
            }

            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || (locale === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'));
                setData(null);
            }
        } catch (err) {
            console.error('Error fetching aging report:', err);
            setError(locale === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [reportType]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const getPercentage = (value: number, total: number) => {
        if (total === 0) return '0.0';
        return ((value / total) * 100).toFixed(1);
    };

    const sortedItems = data?.items ? [...data.items].sort((a, b) => {
        const aVal = a[sortField as keyof AgingItem] as number;
        const bVal = b[sortField as keyof AgingItem] as number;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }) : [];

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        {locale === 'ar' ? 'تقرير أعمار الديون' : 'Aging Report'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {locale === 'ar'
                            ? 'تحليل المستحقات والمطلوبات حسب فترة الاستحقاق'
                            : 'Analysis of receivables and payables by due period'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                        <Button
                            variant={reportType === 'ar' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('ar')}
                            className={reportType === 'ar' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                        >
                            <Users className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'المستحقات' : 'Receivables'}
                        </Button>
                        <Button
                            variant={reportType === 'ap' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('ap')}
                            className={reportType === 'ap' ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                        >
                            <Truck className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'المطلوبات' : 'Payables'}
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchData}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => data && exportToCSV(data, reportType, locale)}
                        disabled={!data || data.items.length === 0}
                    >
                        <Download className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-10 w-10 animate-spin text-slate-400" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                    </div>
                </div>
            ) : error ? (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                        <Button onClick={fetchData} variant="outline" className="mt-4">
                            <RefreshCw className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                    </CardContent>
                </Card>
            ) : data && data.items.length > 0 ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-6">
                        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {locale === 'ar' ? 'جاري' : 'Current'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.summary.current)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getPercentage(data.summary.current, data.summary.total)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{getPercentage(data.summary.current, data.summary.total)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    1-30 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.summary.days1to30)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getPercentage(data.summary.days1to30, data.summary.total)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{getPercentage(data.summary.days1to30, data.summary.total)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                    31-60 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.summary.days31to60)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${getPercentage(data.summary.days31to60, data.summary.total)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{getPercentage(data.summary.days31to60, data.summary.total)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    61-90 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.summary.days61to90)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${getPercentage(data.summary.days61to90, data.summary.total)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{getPercentage(data.summary.days61to90, data.summary.total)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-800/50 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    +90 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.summary.over90)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${getPercentage(data.summary.over90, data.summary.total)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{getPercentage(data.summary.over90, data.summary.total)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 border-0 shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    {locale === 'ar' ? 'الإجمالي' : 'Total'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-white">{formatCurrency(data.summary.total)}</div>
                                <div className="text-xs text-slate-400 mt-1">100%</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Distribution Bar */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                {locale === 'ar' ? 'توزيع الأعمار' : 'Age Distribution'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-10 flex rounded-xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-900">
                                {data.summary.current > 0 && (
                                    <div
                                        className="bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                                        style={{ width: `${getPercentage(data.summary.current, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.current, data.summary.total)) > 8 && `${getPercentage(data.summary.current, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days1to30 > 0 && (
                                    <div
                                        className="bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                                        style={{ width: `${getPercentage(data.summary.days1to30, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days1to30, data.summary.total)) > 8 && `${getPercentage(data.summary.days1to30, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days31to60 > 0 && (
                                    <div
                                        className="bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                                        style={{ width: `${getPercentage(data.summary.days31to60, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days31to60, data.summary.total)) > 8 && `${getPercentage(data.summary.days31to60, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days61to90 > 0 && (
                                    <div
                                        className="bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                                        style={{ width: `${getPercentage(data.summary.days61to90, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days61to90, data.summary.total)) > 8 && `${getPercentage(data.summary.days61to90, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.over90 > 0 && (
                                    <div
                                        className="bg-gradient-to-b from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                                        style={{ width: `${getPercentage(data.summary.over90, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.over90, data.summary.total)) > 8 && `${getPercentage(data.summary.over90, data.summary.total)}%`}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm"></div>
                                    <span className="text-slate-600 dark:text-slate-300">{locale === 'ar' ? 'جاري' : 'Current'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm"></div>
                                    <span className="text-slate-600 dark:text-slate-300">1-30</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm"></div>
                                    <span className="text-slate-600 dark:text-slate-300">31-60</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm"></div>
                                    <span className="text-slate-600 dark:text-slate-300">61-90</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm"></div>
                                    <span className="text-slate-600 dark:text-slate-300">+90</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                {reportType === 'ar'
                                    ? (locale === 'ar' ? 'تفاصيل العملاء' : 'Customer Details')
                                    : (locale === 'ar' ? 'تفاصيل الموردين' : 'Supplier Details')
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{locale === 'ar' ? 'الكود' : 'Code'}</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('current')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {locale === 'ar' ? 'جاري' : 'Current'}
                                                    <SortIcon field="current" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('days1to30')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    1-30
                                                    <SortIcon field="days1to30" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('days31to60')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    31-60
                                                    <SortIcon field="days31to60" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('days61to90')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    61-90
                                                    <SortIcon field="days61to90" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('over90')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    +90
                                                    <SortIcon field="over90" />
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                                onClick={() => handleSort('total')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {locale === 'ar' ? 'الإجمالي' : 'Total'}
                                                    <SortIcon field="total" />
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedItems.map((item, index) => (
                                            <TableRow
                                                key={item.id}
                                                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
                                            >
                                                <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-300">{item.code}</TableCell>
                                                <TableCell className="font-medium text-slate-900 dark:text-white">{item.name}</TableCell>
                                                <TableCell className="text-emerald-600 dark:text-emerald-400">{item.current > 0 ? formatCurrency(item.current) : '-'}</TableCell>
                                                <TableCell className="text-blue-600 dark:text-blue-400">{item.days1to30 > 0 ? formatCurrency(item.days1to30) : '-'}</TableCell>
                                                <TableCell className="text-amber-600 dark:text-amber-400">{item.days31to60 > 0 ? formatCurrency(item.days31to60) : '-'}</TableCell>
                                                <TableCell className="text-orange-600 dark:text-orange-400">{item.days61to90 > 0 ? formatCurrency(item.days61to90) : '-'}</TableCell>
                                                <TableCell className="text-red-600 dark:text-red-400 font-medium">{item.over90 > 0 ? formatCurrency(item.over90) : '-'}</TableCell>
                                                <TableCell className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-100 dark:bg-slate-700/50 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                                            <TableCell></TableCell>
                                            <TableCell className="text-slate-900 dark:text-white">{locale === 'ar' ? 'الإجمالي' : 'Total'}</TableCell>
                                            <TableCell className="text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.current)}</TableCell>
                                            <TableCell className="text-blue-600 dark:text-blue-400">{formatCurrency(data.summary.days1to30)}</TableCell>
                                            <TableCell className="text-amber-600 dark:text-amber-400">{formatCurrency(data.summary.days31to60)}</TableCell>
                                            <TableCell className="text-orange-600 dark:text-orange-400">{formatCurrency(data.summary.days61to90)}</TableCell>
                                            <TableCell className="text-red-600 dark:text-red-400">{formatCurrency(data.summary.over90)}</TableCell>
                                            <TableCell className="text-slate-900 dark:text-white">{formatCurrency(data.summary.total)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            {locale === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            {reportType === 'ar'
                                ? (locale === 'ar' ? 'لا توجد فواتير غير مسددة حالياً' : 'No unpaid invoices at the moment')
                                : (locale === 'ar' ? 'لا توجد فواتير شراء غير مسددة حالياً' : 'No unpaid bills at the moment')
                            }
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
