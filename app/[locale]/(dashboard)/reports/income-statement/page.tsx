'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Download,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IncomeStatementData {
    period: {
        from: string;
        to: string;
    };
    revenue: {
        sales: number;
        otherIncome: number;
        total: number;
    };
    expenses: {
        costOfGoodsSold: number;
        operatingExpenses: number;
        administrativeExpenses: number;
        otherExpenses: number;
        total: number;
    };
    grossProfit: number;
    operatingProfit: number;
    netProfit: number;
    details: {
        salesByCategory: Array<{ name: string; amount: number }>;
        expensesByCategory: Array<{ name: string; amount: number }>;
    };
}

export default function IncomeStatementPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<IncomeStatementData | null>(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to,
            });
            const res = await fetch(`/api/v1/reports/income-statement?${params}`);
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching income statement:', error);
            // Set demo data for now
            setData({
                period: {
                    from: dateRange.from,
                    to: dateRange.to,
                },
                revenue: {
                    sales: 1250000,
                    otherIncome: 25000,
                    total: 1275000,
                },
                expenses: {
                    costOfGoodsSold: 750000,
                    operatingExpenses: 150000,
                    administrativeExpenses: 100000,
                    otherExpenses: 25000,
                    total: 1025000,
                },
                grossProfit: 500000,
                operatingProfit: 350000,
                netProfit: 250000,
                details: {
                    salesByCategory: [
                        { name: locale === 'ar' ? 'مبيعات المنتجات' : 'Product Sales', amount: 1000000 },
                        { name: locale === 'ar' ? 'مبيعات الخدمات' : 'Service Sales', amount: 250000 },
                    ],
                    expensesByCategory: [
                        { name: locale === 'ar' ? 'المشتريات' : 'Purchases', amount: 750000 },
                        { name: locale === 'ar' ? 'الرواتب' : 'Salaries', amount: 100000 },
                        { name: locale === 'ar' ? 'الإيجار' : 'Rent', amount: 50000 },
                        { name: locale === 'ar' ? 'المرافق' : 'Utilities', amount: 25000 },
                        { name: locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses', amount: 100000 },
                    ],
                },
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const profitMargin = data ? ((data.netProfit / data.revenue.total) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'قائمة الدخل' : 'Income Statement'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar' ? 'ملخص الإيرادات والمصروفات والأرباح' : 'Summary of revenue, expenses, and profit'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border p-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            className="border-0 bg-transparent text-sm focus:outline-none"
                        />
                        <span className="text-muted-foreground">-</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            className="border-0 bg-transparent text-sm focus:outline-none"
                        />
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
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue.total)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
                                </CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses.total)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'صافي الربح' : 'Net Profit'}
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(data.netProfit)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'هامش الربح' : 'Profit Margin'}
                                </CardTitle>
                                {Number(profitMargin) >= 0 ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {profitMargin}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Income Statement Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'قائمة الدخل التفصيلية' : 'Detailed Income Statement'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Revenue Section */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-green-600">
                                        {locale === 'ar' ? 'الإيرادات' : 'Revenue'}
                                    </h3>
                                    <div className="space-y-2 ps-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'المبيعات' : 'Sales'}</span>
                                            <span className="font-medium">{formatCurrency(data.revenue.sales)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'إيرادات أخرى' : 'Other Income'}</span>
                                            <span className="font-medium">{formatCurrency(data.revenue.otherIncome)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 bg-green-50 dark:bg-green-950/20 px-2 rounded font-bold">
                                            <span>{locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
                                            <span className="text-green-600">{formatCurrency(data.revenue.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost of Goods Sold */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-red-600">
                                        {locale === 'ar' ? 'تكلفة المبيعات' : 'Cost of Goods Sold'}
                                    </h3>
                                    <div className="space-y-2 ps-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'تكلفة البضاعة المباعة' : 'Cost of Goods Sold'}</span>
                                            <span className="font-medium text-red-600">({formatCurrency(data.expenses.costOfGoodsSold)})</span>
                                        </div>
                                        <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-950/20 px-2 rounded font-bold">
                                            <span>{locale === 'ar' ? 'مجمل الربح' : 'Gross Profit'}</span>
                                            <span className={data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.grossProfit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operating Expenses */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-orange-600">
                                        {locale === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}
                                    </h3>
                                    <div className="space-y-2 ps-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'مصروفات تشغيلية' : 'Operating Expenses'}</span>
                                            <span className="font-medium text-red-600">({formatCurrency(data.expenses.operatingExpenses)})</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'مصروفات إدارية' : 'Administrative Expenses'}</span>
                                            <span className="font-medium text-red-600">({formatCurrency(data.expenses.administrativeExpenses)})</span>
                                        </div>
                                        <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-950/20 px-2 rounded font-bold">
                                            <span>{locale === 'ar' ? 'ربح العمليات' : 'Operating Profit'}</span>
                                            <span className={data.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(data.operatingProfit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Other Expenses */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-600">
                                        {locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses'}
                                    </h3>
                                    <div className="space-y-2 ps-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span>{locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses'}</span>
                                            <span className="font-medium text-red-600">({formatCurrency(data.expenses.otherExpenses)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Profit */}
                                <div className="pt-4 border-t-2">
                                    <div className="flex justify-between py-3 bg-primary/10 px-4 rounded-lg">
                                        <span className="text-xl font-bold">{locale === 'ar' ? 'صافي الربح' : 'Net Profit'}</span>
                                        <span className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Sales by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{locale === 'ar' ? 'المبيعات حسب التصنيف' : 'Sales by Category'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.details.salesByCategory.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <Badge variant="secondary">{formatCurrency(item.amount)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Expenses by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{locale === 'ar' ? 'المصروفات حسب التصنيف' : 'Expenses by Category'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.details.expensesByCategory.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <Badge variant="destructive">{formatCurrency(item.amount)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {locale === 'ar' ? 'لا توجد بيانات للفترة المحددة' : 'No data available for the selected period'}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
