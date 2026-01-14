'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Users,
    Truck,
    RefreshCw,
    Download,
    AlertTriangle,
    Clock,
    DollarSign,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function AgingReportPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<ReportType>('ar');
    const [data, setData] = useState<AgingData | null>(null);
    const [sortField, setSortField] = useState<string>('total');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = reportType === 'ar' ? '/api/v1/reports/ar-aging' : '/api/v1/reports/ap-aging';
            const res = await fetch(endpoint);
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching aging report:', error);
            // Demo data
            const demoItems: AgingItem[] = reportType === 'ar' ? [
                { id: '1', name: 'شركة الأمل للتجارة', code: 'C001', current: 50000, days1to30: 25000, days31to60: 15000, days61to90: 5000, over90: 2000, total: 97000 },
                { id: '2', name: 'مؤسسة النور', code: 'C002', current: 30000, days1to30: 10000, days31to60: 8000, days61to90: 0, over90: 0, total: 48000 },
                { id: '3', name: 'شركة السلام', code: 'C003', current: 45000, days1to30: 0, days31to60: 0, days61to90: 12000, over90: 8000, total: 65000 },
                { id: '4', name: 'مصنع الرياض', code: 'C004', current: 75000, days1to30: 35000, days31to60: 0, days61to90: 0, over90: 0, total: 110000 },
                { id: '5', name: 'شركة البركة', code: 'C005', current: 20000, days1to30: 15000, days31to60: 10000, days61to90: 5000, over90: 15000, total: 65000 },
            ] : [
                { id: '1', name: 'مورد المواد الخام', code: 'S001', current: 40000, days1to30: 20000, days31to60: 10000, days61to90: 0, over90: 0, total: 70000 },
                { id: '2', name: 'شركة التوريدات', code: 'S002', current: 55000, days1to30: 15000, days31to60: 0, days61to90: 8000, over90: 5000, total: 83000 },
                { id: '3', name: 'مصنع العبوات', code: 'S003', current: 30000, days1to30: 10000, days31to60: 5000, days61to90: 0, over90: 0, total: 45000 },
            ];

            const summary = demoItems.reduce((acc, item) => ({
                current: acc.current + item.current,
                days1to30: acc.days1to30 + item.days1to30,
                days31to60: acc.days31to60 + item.days31to60,
                days61to90: acc.days61to90 + item.days61to90,
                over90: acc.over90 + item.over90,
                total: acc.total + item.total,
            }), { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 });

            setData({ summary, items: demoItems });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [reportType]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const getPercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return ((value / total) * 100).toFixed(1);
    };

    const sortedItems = data?.items.sort((a, b) => {
        const aVal = a[sortField as keyof AgingItem] as number;
        const bVal = b[sortField as keyof AgingItem] as number;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

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

    const getBucketColor = (bucket: string) => {
        switch (bucket) {
            case 'current': return 'bg-green-500';
            case 'days1to30': return 'bg-blue-500';
            case 'days31to60': return 'bg-yellow-500';
            case 'days61to90': return 'bg-orange-500';
            case 'over90': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'تقرير أعمار الديون' : 'Aging Report'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'تحليل المستحقات والمطلوبات حسب العمر'
                            : 'Analysis of receivables and payables by age'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border p-1">
                        <Button
                            variant={reportType === 'ar' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('ar')}
                        >
                            <Users className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'العملاء' : 'Receivables'}
                        </Button>
                        <Button
                            variant={reportType === 'ap' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('ap')}
                        >
                            <Truck className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'الموردين' : 'Payables'}
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-600">
                                    {locale === 'ar' ? 'جاري' : 'Current'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{formatCurrency(data.summary.current)}</div>
                                <div className="text-xs text-muted-foreground">{getPercentage(data.summary.current, data.summary.total)}%</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-600">
                                    1-30 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{formatCurrency(data.summary.days1to30)}</div>
                                <div className="text-xs text-muted-foreground">{getPercentage(data.summary.days1to30, data.summary.total)}%</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-600">
                                    31-60 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{formatCurrency(data.summary.days31to60)}</div>
                                <div className="text-xs text-muted-foreground">{getPercentage(data.summary.days31to60, data.summary.total)}%</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-orange-600">
                                    61-90 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{formatCurrency(data.summary.days61to90)}</div>
                                <div className="text-xs text-muted-foreground">{getPercentage(data.summary.days61to90, data.summary.total)}%</div>
                            </CardContent>
                        </Card>

                        <Card className="border-red-500/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    +90 {locale === 'ar' ? 'يوم' : 'days'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-red-600">{formatCurrency(data.summary.over90)}</div>
                                <div className="text-xs text-muted-foreground">{getPercentage(data.summary.over90, data.summary.total)}%</div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'الإجمالي' : 'Total'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-primary">{formatCurrency(data.summary.total)}</div>
                                <div className="text-xs text-muted-foreground">100%</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {locale === 'ar' ? 'توزيع الأعمار' : 'Age Distribution'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 flex rounded-lg overflow-hidden">
                                {data.summary.current > 0 && (
                                    <div
                                        className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${getPercentage(data.summary.current, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.current, data.summary.total)) > 10 && `${getPercentage(data.summary.current, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days1to30 > 0 && (
                                    <div
                                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${getPercentage(data.summary.days1to30, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days1to30, data.summary.total)) > 10 && `${getPercentage(data.summary.days1to30, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days31to60 > 0 && (
                                    <div
                                        className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${getPercentage(data.summary.days31to60, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days31to60, data.summary.total)) > 10 && `${getPercentage(data.summary.days31to60, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.days61to90 > 0 && (
                                    <div
                                        className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${getPercentage(data.summary.days61to90, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.days61to90, data.summary.total)) > 10 && `${getPercentage(data.summary.days61to90, data.summary.total)}%`}
                                    </div>
                                )}
                                {data.summary.over90 > 0 && (
                                    <div
                                        className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${getPercentage(data.summary.over90, data.summary.total)}%` }}
                                    >
                                        {Number(getPercentage(data.summary.over90, data.summary.total)) > 10 && `${getPercentage(data.summary.over90, data.summary.total)}%`}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-green-500"></div>
                                    <span>{locale === 'ar' ? 'جاري' : 'Current'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                                    <span>1-30</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                    <span>31-60</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                                    <span>61-90</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-red-500"></div>
                                    <span>+90</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {reportType === 'ar'
                                    ? (locale === 'ar' ? 'تفاصيل العملاء' : 'Customer Details')
                                    : (locale === 'ar' ? 'تفاصيل الموردين' : 'Supplier Details')
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{locale === 'ar' ? 'الكود' : 'Code'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('current')}
                                        >
                                            <div className="flex items-center gap-1">
                                                {locale === 'ar' ? 'جاري' : 'Current'}
                                                <SortIcon field="current" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('days1to30')}
                                        >
                                            <div className="flex items-center gap-1">
                                                1-30
                                                <SortIcon field="days1to30" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('days31to60')}
                                        >
                                            <div className="flex items-center gap-1">
                                                31-60
                                                <SortIcon field="days31to60" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('days61to90')}
                                        >
                                            <div className="flex items-center gap-1">
                                                61-90
                                                <SortIcon field="days61to90" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('over90')}
                                        >
                                            <div className="flex items-center gap-1">
                                                +90
                                                <SortIcon field="over90" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
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
                                    {sortedItems?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-green-600">{item.current > 0 ? formatCurrency(item.current) : '-'}</TableCell>
                                            <TableCell className="text-blue-600">{item.days1to30 > 0 ? formatCurrency(item.days1to30) : '-'}</TableCell>
                                            <TableCell className="text-yellow-600">{item.days31to60 > 0 ? formatCurrency(item.days31to60) : '-'}</TableCell>
                                            <TableCell className="text-orange-600">{item.days61to90 > 0 ? formatCurrency(item.days61to90) : '-'}</TableCell>
                                            <TableCell className="text-red-600 font-medium">{item.over90 > 0 ? formatCurrency(item.over90) : '-'}</TableCell>
                                            <TableCell className="font-bold">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell></TableCell>
                                        <TableCell>{locale === 'ar' ? 'الإجمالي' : 'Total'}</TableCell>
                                        <TableCell className="text-green-600">{formatCurrency(data.summary.current)}</TableCell>
                                        <TableCell className="text-blue-600">{formatCurrency(data.summary.days1to30)}</TableCell>
                                        <TableCell className="text-yellow-600">{formatCurrency(data.summary.days31to60)}</TableCell>
                                        <TableCell className="text-orange-600">{formatCurrency(data.summary.days61to90)}</TableCell>
                                        <TableCell className="text-red-600">{formatCurrency(data.summary.over90)}</TableCell>
                                        <TableCell className="text-primary">{formatCurrency(data.summary.total)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
