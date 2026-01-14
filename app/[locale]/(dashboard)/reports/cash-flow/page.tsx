'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    RefreshCw,
    Download,
    Printer,
    Calendar,
    Building2,
    ShoppingCart,
    Package,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CashFlowCategory {
    name: string;
    items: CashFlowItem[];
    total: number;
}

interface CashFlowItem {
    label: string;
    amount: number;
    previousAmount?: number;
}

interface CashFlowData {
    period: string;
    openingBalance: number;
    closingBalance: number;
    operatingActivities: CashFlowCategory;
    investingActivities: CashFlowCategory;
    financingActivities: CashFlowCategory;
    netCashFlow: number;
}

export default function CashFlowPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CashFlowData | null>(null);
    const [period, setPeriod] = useState<string>('month');
    const [year, setYear] = useState<string>('2024');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/reports/cash-flow?period=${period}&year=${year}`);
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching cash flow:', error);
            // Demo data
            setData({
                period: locale === 'ar' ? 'يناير 2024' : 'January 2024',
                openingBalance: 500000,
                closingBalance: 785000,
                operatingActivities: {
                    name: locale === 'ar' ? 'الأنشطة التشغيلية' : 'Operating Activities',
                    items: [
                        { label: locale === 'ar' ? 'صافي الربح' : 'Net Income', amount: 250000, previousAmount: 220000 },
                        { label: locale === 'ar' ? 'الإهلاك' : 'Depreciation', amount: 35000, previousAmount: 30000 },
                        { label: locale === 'ar' ? 'تغير في الذمم المدينة' : 'Change in Receivables', amount: -45000, previousAmount: -30000 },
                        { label: locale === 'ar' ? 'تغير في المخزون' : 'Change in Inventory', amount: -30000, previousAmount: -25000 },
                        { label: locale === 'ar' ? 'تغير في الذمم الدائنة' : 'Change in Payables', amount: 25000, previousAmount: 15000 },
                    ],
                    total: 235000,
                },
                investingActivities: {
                    name: locale === 'ar' ? 'الأنشطة الاستثمارية' : 'Investing Activities',
                    items: [
                        { label: locale === 'ar' ? 'شراء أصول ثابتة' : 'Purchase of Fixed Assets', amount: -80000, previousAmount: -50000 },
                        { label: locale === 'ar' ? 'بيع أصول' : 'Sale of Assets', amount: 15000, previousAmount: 0 },
                        { label: locale === 'ar' ? 'استثمارات' : 'Investments', amount: -25000, previousAmount: -20000 },
                    ],
                    total: -90000,
                },
                financingActivities: {
                    name: locale === 'ar' ? 'الأنشطة التمويلية' : 'Financing Activities',
                    items: [
                        { label: locale === 'ar' ? 'قروض جديدة' : 'New Loans', amount: 200000, previousAmount: 0 },
                        { label: locale === 'ar' ? 'سداد قروض' : 'Loan Repayments', amount: -50000, previousAmount: -45000 },
                        { label: locale === 'ar' ? 'توزيعات أرباح' : 'Dividends Paid', amount: -10000, previousAmount: -15000 },
                    ],
                    total: 140000,
                },
                netCashFlow: 285000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, year, locale]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const getChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / Math.abs(previous)) * 100;
        return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
    };

    const CategorySection = ({ category, icon: Icon }: { category: CashFlowCategory; icon: React.ElementType }) => (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {category.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        {category.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.label}</TableCell>
                                <TableCell className="text-end">
                                    <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(item.amount)}
                                    </span>
                                </TableCell>
                                {item.previousAmount !== undefined && (
                                    <TableCell className="text-end text-muted-foreground w-24">
                                        <span className={`text-sm ${item.amount >= item.previousAmount ? 'text-green-600' : 'text-red-600'}`}>
                                            {getChangePercentage(item.amount, item.previousAmount)}
                                        </span>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                            <TableCell className="font-bold">
                                {locale === 'ar' ? 'صافي النقد من ' : 'Net Cash from '}{category.name}
                            </TableCell>
                            <TableCell className="text-end font-bold" colSpan={2}>
                                <span className={category.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(category.total)}
                                </span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'قائمة التدفقات النقدية' : 'Cash Flow Statement'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'تحليل مصادر واستخدامات النقد'
                            : 'Analysis of cash sources and uses'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[150px]">
                            <Calendar className="h-4 w-4 me-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">{locale === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                            <SelectItem value="quarter">{locale === 'ar' ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
                            <SelectItem value="year">{locale === 'ar' ? 'سنوي' : 'Yearly'}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline">
                        <Printer className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'طباعة' : 'Print'}
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
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {locale === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(data.openingBalance)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {data.netCashFlow >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    {locale === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {locale === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                    {formatCurrency(data.closingBalance)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {locale === 'ar' ? 'التغير' : 'Change'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${(data.closingBalance - data.openingBalance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {getChangePercentage(data.closingBalance, data.openingBalance)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cash Flow Sections */}
                    <div className="grid gap-6">
                        <CategorySection category={data.operatingActivities} icon={Building2} />
                        <CategorySection category={data.investingActivities} icon={Package} />
                        <CategorySection category={data.financingActivities} icon={Wallet} />
                    </div>

                    {/* Summary */}
                    <Card className="border-primary">
                        <CardContent className="py-6">
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">{locale === 'ar' ? 'صافي النقد من الأنشطة التشغيلية' : 'Net Cash from Operating Activities'}</TableCell>
                                        <TableCell className="text-end">
                                            <span className={data.operatingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.operatingActivities.total)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">{locale === 'ar' ? 'صافي النقد من الأنشطة الاستثمارية' : 'Net Cash from Investing Activities'}</TableCell>
                                        <TableCell className="text-end">
                                            <span className={data.investingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.investingActivities.total)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">{locale === 'ar' ? 'صافي النقد من الأنشطة التمويلية' : 'Net Cash from Financing Activities'}</TableCell>
                                        <TableCell className="text-end">
                                            <span className={data.financingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.financingActivities.total)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="bg-muted/50 text-lg">
                                        <TableCell className="font-bold">{locale === 'ar' ? 'صافي الزيادة (النقص) في النقد' : 'Net Increase (Decrease) in Cash'}</TableCell>
                                        <TableCell className="text-end font-bold">
                                            <span className={data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.netCashFlow)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">{locale === 'ar' ? 'النقد في بداية الفترة' : 'Cash at Beginning of Period'}</TableCell>
                                        <TableCell className="text-end">{formatCurrency(data.openingBalance)}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-primary/10 text-lg">
                                        <TableCell className="font-bold">{locale === 'ar' ? 'النقد في نهاية الفترة' : 'Cash at End of Period'}</TableCell>
                                        <TableCell className="text-end font-bold text-primary">
                                            {formatCurrency(data.closingBalance)}
                                        </TableCell>
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
