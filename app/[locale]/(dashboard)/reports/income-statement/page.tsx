'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
    Printer,
    RefreshCw,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    FileText,
    Building
} from 'lucide-react';

interface IncomeStatementData {
    period: {
        from: string;
        to: string;
    };
    revenue: {
        salesRevenue: number;
        serviceRevenue: number;
        otherRevenue: number;
        salesReturns: number;
        salesDiscounts: number;
        totalRevenue: number;
    };
    costOfGoodsSold: {
        beginningInventory: number;
        purchases: number;
        purchaseReturns: number;
        purchaseDiscounts: number;
        endingInventory: number;
        totalCOGS: number;
    };
    grossProfit: number;
    operatingExpenses: {
        salaries: number;
        rent: number;
        utilities: number;
        depreciation: number;
        marketing: number;
        insurance: number;
        officeSupplies: number;
        otherExpenses: number;
        totalOperatingExpenses: number;
    };
    operatingIncome: number;
    otherIncomeExpenses: {
        interestIncome: number;
        interestExpense: number;
        otherIncome: number;
        otherExpense: number;
        totalOtherIncomeExpenses: number;
    };
    incomeBeforeTax: number;
    incomeTax: number;
    netIncome: number;
}

export default function IncomeStatementPage() {
    const locale = useLocale();
    const t = useTranslations();
    const isRTL = locale === 'ar';

    const [data, setData] = useState<IncomeStatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(0, 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/reports/income-statement?from=${startDate}&to=${endDate}`);
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(locale === 'ar' ? 'غير مصرح. يرجى تسجيل الدخول أولاً.' : 'Unauthorized. Please login first.');
                }
                throw new Error(locale === 'ar' ? 'فشل في جلب بيانات قائمة الدخل' : 'Failed to fetch income statement data');
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = useCallback(() => {
        if (!data) return;

        const rows: string[][] = [
            [locale === 'ar' ? 'قائمة الدخل' : 'Income Statement'],
            [locale === 'ar' ? 'من' : 'From', startDate, locale === 'ar' ? 'إلى' : 'To', endDate],
            [],
            [locale === 'ar' ? 'البند' : 'Item', locale === 'ar' ? 'المبلغ' : 'Amount'],
            [],
            [locale === 'ar' ? 'الإيرادات' : 'REVENUE'],
            [locale === 'ar' ? 'إيرادات المبيعات' : 'Sales Revenue', data.revenue.salesRevenue.toString()],
            [locale === 'ar' ? 'إيرادات الخدمات' : 'Service Revenue', data.revenue.serviceRevenue.toString()],
            [locale === 'ar' ? 'إيرادات أخرى' : 'Other Revenue', data.revenue.otherRevenue.toString()],
            [locale === 'ar' ? 'مردودات المبيعات' : 'Sales Returns', (-data.revenue.salesReturns).toString()],
            [locale === 'ar' ? 'خصومات المبيعات' : 'Sales Discounts', (-data.revenue.salesDiscounts).toString()],
            [locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', data.revenue.totalRevenue.toString()],
            [],
            [locale === 'ar' ? 'تكلفة البضاعة المباعة' : 'COST OF GOODS SOLD'],
            [locale === 'ar' ? 'مخزون أول الفترة' : 'Beginning Inventory', data.costOfGoodsSold.beginningInventory.toString()],
            [locale === 'ar' ? 'المشتريات' : 'Purchases', data.costOfGoodsSold.purchases.toString()],
            [locale === 'ar' ? 'مردودات المشتريات' : 'Purchase Returns', (-data.costOfGoodsSold.purchaseReturns).toString()],
            [locale === 'ar' ? 'خصومات المشتريات' : 'Purchase Discounts', (-data.costOfGoodsSold.purchaseDiscounts).toString()],
            [locale === 'ar' ? 'مخزون آخر الفترة' : 'Ending Inventory', (-data.costOfGoodsSold.endingInventory).toString()],
            [locale === 'ar' ? 'إجمالي تكلفة البضاعة المباعة' : 'Total COGS', data.costOfGoodsSold.totalCOGS.toString()],
            [],
            [locale === 'ar' ? 'مجمل الربح' : 'GROSS PROFIT', data.grossProfit.toString()],
            [],
            [locale === 'ar' ? 'المصروفات التشغيلية' : 'OPERATING EXPENSES'],
            [locale === 'ar' ? 'الرواتب' : 'Salaries', data.operatingExpenses.salaries.toString()],
            [locale === 'ar' ? 'الإيجار' : 'Rent', data.operatingExpenses.rent.toString()],
            [locale === 'ar' ? 'المرافق' : 'Utilities', data.operatingExpenses.utilities.toString()],
            [locale === 'ar' ? 'الإهلاك' : 'Depreciation', data.operatingExpenses.depreciation.toString()],
            [locale === 'ar' ? 'التسويق' : 'Marketing', data.operatingExpenses.marketing.toString()],
            [locale === 'ar' ? 'التأمين' : 'Insurance', data.operatingExpenses.insurance.toString()],
            [locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses', data.operatingExpenses.otherExpenses.toString()],
            [locale === 'ar' ? 'إجمالي المصروفات التشغيلية' : 'Total Operating Expenses', data.operatingExpenses.totalOperatingExpenses.toString()],
            [],
            [locale === 'ar' ? 'الربح التشغيلي' : 'OPERATING INCOME', data.operatingIncome.toString()],
            [],
            [locale === 'ar' ? 'صافي الدخل قبل الضريبة' : 'Income Before Tax', data.incomeBeforeTax.toString()],
            [locale === 'ar' ? 'ضريبة الدخل' : 'Income Tax', data.incomeTax.toString()],
            [],
            [locale === 'ar' ? 'صافي الربح' : 'NET INCOME', data.netIncome.toString()],
        ];

        const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `income-statement-${startDate}-to-${endDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [data, locale, startDate, endDate]);

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

    const getChangeIndicator = (value: number, isExpense = false) => {
        if (value === 0) return <Minus className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
        if (isExpense) {
            return value > 0
                ? <ArrowUpRight className="w-4 h-4 text-red-500" />
                : <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
        }
        return value > 0
            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-500" />;
    };

    const LineItem = ({
        label,
        amount,
        isTotal = false,
        isSubtotal = false,
        isNegative = false,
        indent = 0
    }: {
        label: string;
        amount: number;
        isTotal?: boolean;
        isSubtotal?: boolean;
        isNegative?: boolean;
        indent?: number;
    }) => (
        <div
            className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${isTotal
                ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 dark:from-blue-500/20 dark:to-indigo-500/20 font-bold text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                : isSubtotal
                    ? 'bg-slate-100 dark:bg-slate-800/50 font-semibold text-slate-800 dark:text-slate-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
            style={{ paddingLeft: `${(indent * 16) + 12}px` }}
        >
            <span className={`${isTotal ? 'text-base' : isSubtotal ? 'text-sm' : 'text-sm text-slate-700 dark:text-slate-300'}`}>
                {label}
            </span>
            <span className={`font-mono ${isTotal
                ? 'text-base'
                : isSubtotal
                    ? 'text-sm'
                    : isNegative
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-slate-100'
                }`}>
                {isNegative && amount > 0 ? `(${formatCurrency(amount)})` : formatCurrency(amount)}
            </span>
        </div>
    );

    const SectionHeader = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
        <div className="flex items-center gap-2 py-3 border-b border-slate-200 dark:border-slate-700 mb-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
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
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                {locale === 'ar' ? 'قائمة الدخل' : 'Income Statement'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {locale === 'ar' ? 'تقرير الأرباح والخسائر' : 'Profit & Loss Report'}
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
                            disabled={!data}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            {locale === 'ar' ? 'تصدير' : 'Export'}
                        </Button>
                    </div>
                </div>

                {/* Date Filters */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[180px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'من تاريخ' : 'From Date'}
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'إلى تاريخ' : 'To Date'}
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={fetchData}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
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
                ) : data ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total Revenue */}
                            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">
                                                {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.revenue.totalRevenue)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gross Profit */}
                            <Card className={`border-0 shadow-xl ${data.grossProfit >= 0
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                                : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25'
                                }`}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm ${data.grossProfit >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                                                {locale === 'ar' ? 'إجمالي الربح' : 'Gross Profit'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.grossProfit)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Net Income */}
                            <Card className={`border-0 shadow-xl ${data.netIncome >= 0
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/25'
                                : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25'
                                }`}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm ${data.netIncome >= 0 ? 'text-violet-100' : 'text-red-100'}`}>
                                                {locale === 'ar' ? 'صافي الربح' : 'Net Income'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.netIncome)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            {data.netIncome >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Income Statement Details */}
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                                                {locale === 'ar' ? 'تفاصيل قائمة الدخل' : 'Income Statement Details'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                                {locale === 'ar'
                                                    ? `للفترة من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`
                                                    : `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                                                }
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Revenue Section */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'الإيرادات' : 'Revenue'}
                                        icon={TrendingUp}
                                    />
                                    <div className="space-y-1.5">
                                        <LineItem
                                            label={locale === 'ar' ? 'إيرادات المبيعات' : 'Sales Revenue'}
                                            amount={data.revenue.salesRevenue}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'إيرادات الخدمات' : 'Service Revenue'}
                                            amount={data.revenue.serviceRevenue}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'إيرادات أخرى' : 'Other Revenue'}
                                            amount={data.revenue.otherRevenue}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مردودات المبيعات' : 'Sales Returns'}
                                            amount={data.revenue.salesReturns}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'خصومات المبيعات' : 'Sales Discounts'}
                                            amount={data.revenue.salesDiscounts}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'صافي الإيرادات' : 'Net Revenue'}
                                            amount={data.revenue.totalRevenue}
                                            isSubtotal
                                        />
                                    </div>
                                </div>

                                {/* Cost of Goods Sold Section */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'تكلفة البضاعة المباعة' : 'Cost of Goods Sold'}
                                        icon={TrendingDown}
                                    />
                                    <div className="space-y-1.5">
                                        <LineItem
                                            label={locale === 'ar' ? 'مخزون أول المدة' : 'Beginning Inventory'}
                                            amount={data.costOfGoodsSold.beginningInventory}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'المشتريات' : 'Purchases'}
                                            amount={data.costOfGoodsSold.purchases}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مردودات المشتريات' : 'Purchase Returns'}
                                            amount={data.costOfGoodsSold.purchaseReturns}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'خصومات المشتريات' : 'Purchase Discounts'}
                                            amount={data.costOfGoodsSold.purchaseDiscounts}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مخزون آخر المدة' : 'Ending Inventory'}
                                            amount={data.costOfGoodsSold.endingInventory}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'إجمالي تكلفة البضاعة المباعة' : 'Total COGS'}
                                            amount={data.costOfGoodsSold.totalCOGS}
                                            isSubtotal
                                        />
                                    </div>
                                </div>

                                {/* Gross Profit */}
                                <LineItem
                                    label={locale === 'ar' ? 'إجمالي الربح' : 'Gross Profit'}
                                    amount={data.grossProfit}
                                    isTotal
                                />

                                {/* Operating Expenses Section */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}
                                        icon={TrendingDown}
                                    />
                                    <div className="space-y-1.5">
                                        <LineItem
                                            label={locale === 'ar' ? 'الرواتب والأجور' : 'Salaries & Wages'}
                                            amount={data.operatingExpenses.salaries}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'الإيجار' : 'Rent'}
                                            amount={data.operatingExpenses.rent}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'المرافق' : 'Utilities'}
                                            amount={data.operatingExpenses.utilities}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'الإهلاك' : 'Depreciation'}
                                            amount={data.operatingExpenses.depreciation}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'التسويق والإعلان' : 'Marketing & Advertising'}
                                            amount={data.operatingExpenses.marketing}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'التأمين' : 'Insurance'}
                                            amount={data.operatingExpenses.insurance}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مستلزمات المكتب' : 'Office Supplies'}
                                            amount={data.operatingExpenses.officeSupplies}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses'}
                                            amount={data.operatingExpenses.otherExpenses}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'إجمالي المصروفات التشغيلية' : 'Total Operating Expenses'}
                                            amount={data.operatingExpenses.totalOperatingExpenses}
                                            isSubtotal
                                        />
                                    </div>
                                </div>

                                {/* Operating Income */}
                                <LineItem
                                    label={locale === 'ar' ? 'الدخل التشغيلي' : 'Operating Income'}
                                    amount={data.operatingIncome}
                                    isTotal
                                />

                                {/* Other Income/Expenses Section */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'إيرادات ومصروفات أخرى' : 'Other Income & Expenses'}
                                        icon={DollarSign}
                                    />
                                    <div className="space-y-1.5">
                                        <LineItem
                                            label={locale === 'ar' ? 'إيرادات الفوائد' : 'Interest Income'}
                                            amount={data.otherIncomeExpenses.interestIncome}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مصروفات الفوائد' : 'Interest Expense'}
                                            amount={data.otherIncomeExpenses.interestExpense}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'إيرادات أخرى' : 'Other Income'}
                                            amount={data.otherIncomeExpenses.otherIncome}
                                            indent={1}
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'مصروفات أخرى' : 'Other Expenses'}
                                            amount={data.otherIncomeExpenses.otherExpense}
                                            indent={1}
                                            isNegative
                                        />
                                        <LineItem
                                            label={locale === 'ar' ? 'صافي الإيرادات والمصروفات الأخرى' : 'Net Other Income/Expenses'}
                                            amount={data.otherIncomeExpenses.totalOtherIncomeExpenses}
                                            isSubtotal
                                        />
                                    </div>
                                </div>

                                {/* Income Before Tax */}
                                <LineItem
                                    label={locale === 'ar' ? 'الدخل قبل الضريبة' : 'Income Before Tax'}
                                    amount={data.incomeBeforeTax}
                                    isSubtotal
                                />

                                {/* Income Tax */}
                                <LineItem
                                    label={locale === 'ar' ? 'ضريبة الدخل' : 'Income Tax'}
                                    amount={data.incomeTax}
                                    isNegative
                                />

                                {/* Net Income */}
                                <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-600">
                                    <LineItem
                                        label={locale === 'ar' ? 'صافي الدخل' : 'Net Income'}
                                        amount={data.netIncome}
                                        isTotal
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    );
}
