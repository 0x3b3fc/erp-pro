'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Building2,
    Wallet,
    TrendingUp,
    RefreshCw,
    Download,
    Calendar,
    Scale,
    ChevronRight,
    ChevronDown,
    Printer,
    FileText,
    Landmark,
    PiggyBank,
    CreditCard,
    Package,
    Banknote,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BalanceSheetData {
    asOfDate: string;
    assets: {
        currentAssets: {
            cash: number;
            accountsReceivable: number;
            inventory: number;
            prepaidExpenses: number;
            total: number;
        };
        fixedAssets: {
            propertyAndEquipment: number;
            accumulatedDepreciation: number;
            total: number;
        };
        totalAssets: number;
    };
    liabilities: {
        currentLiabilities: {
            accountsPayable: number;
            accruedExpenses: number;
            shortTermLoans: number;
            total: number;
        };
        longTermLiabilities: {
            longTermLoans: number;
            total: number;
        };
        totalLiabilities: number;
    };
    equity: {
        capital: number;
        retainedEarnings: number;
        currentYearProfit: number;
        totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
}

export default function BalanceSheetPage() {
    const t = useTranslations();
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BalanceSheetData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedSections, setExpandedSections] = useState<string[]>(['currentAssets', 'fixedAssets', 'currentLiabilities', 'longTermLiabilities', 'equity']);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/reports/balance-sheet?asOfDate=${asOfDate}`);
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(locale === 'ar' ? 'غير مصرح. يرجى تسجيل الدخول أولاً.' : 'Unauthorized. Please login first.');
                }
                throw new Error(locale === 'ar' ? 'فشل في جلب بيانات الميزانية' : 'Failed to fetch balance sheet data');
            }
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            } else {
                setData(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = useCallback(() => {
        if (!data) return;

        const rows: string[][] = [
            [locale === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet'],
            [locale === 'ar' ? 'التاريخ' : 'Date', asOfDate],
            [],
            [locale === 'ar' ? 'البند' : 'Item', locale === 'ar' ? 'المبلغ' : 'Amount'],
            [],
            [locale === 'ar' ? 'الأصول' : 'ASSETS'],
            [locale === 'ar' ? 'الأصول المتداولة' : 'Current Assets'],
            [locale === 'ar' ? 'النقدية' : 'Cash', data.assets.currentAssets.cash.toString()],
            [locale === 'ar' ? 'العملاء' : 'Accounts Receivable', data.assets.currentAssets.accountsReceivable.toString()],
            [locale === 'ar' ? 'المخزون' : 'Inventory', data.assets.currentAssets.inventory.toString()],
            [locale === 'ar' ? 'مصروفات مدفوعة مقدماً' : 'Prepaid Expenses', data.assets.currentAssets.prepaidExpenses.toString()],
            [locale === 'ar' ? 'إجمالي الأصول المتداولة' : 'Total Current Assets', data.assets.currentAssets.total.toString()],
            [],
            [locale === 'ar' ? 'الأصول الثابتة' : 'Fixed Assets'],
            [locale === 'ar' ? 'الممتلكات والمعدات' : 'Property & Equipment', data.assets.fixedAssets.propertyAndEquipment.toString()],
            [locale === 'ar' ? 'مجمع الإهلاك' : 'Accumulated Depreciation', (-data.assets.fixedAssets.accumulatedDepreciation).toString()],
            [locale === 'ar' ? 'إجمالي الأصول الثابتة' : 'Total Fixed Assets', data.assets.fixedAssets.total.toString()],
            [],
            [locale === 'ar' ? 'إجمالي الأصول' : 'TOTAL ASSETS', data.assets.totalAssets.toString()],
            [],
            [locale === 'ar' ? 'الخصوم' : 'LIABILITIES'],
            [locale === 'ar' ? 'الخصوم المتداولة' : 'Current Liabilities'],
            [locale === 'ar' ? 'الموردين' : 'Accounts Payable', data.liabilities.currentLiabilities.accountsPayable.toString()],
            [locale === 'ar' ? 'مصروفات مستحقة' : 'Accrued Expenses', data.liabilities.currentLiabilities.accruedExpenses.toString()],
            [locale === 'ar' ? 'قروض قصيرة الأجل' : 'Short Term Loans', data.liabilities.currentLiabilities.shortTermLoans.toString()],
            [locale === 'ar' ? 'إجمالي الخصوم المتداولة' : 'Total Current Liabilities', data.liabilities.currentLiabilities.total.toString()],
            [],
            [locale === 'ar' ? 'الخصوم طويلة الأجل' : 'Long Term Liabilities'],
            [locale === 'ar' ? 'قروض طويلة الأجل' : 'Long Term Loans', data.liabilities.longTermLiabilities.longTermLoans.toString()],
            [locale === 'ar' ? 'إجمالي الخصوم طويلة الأجل' : 'Total Long Term Liabilities', data.liabilities.longTermLiabilities.total.toString()],
            [],
            [locale === 'ar' ? 'إجمالي الخصوم' : 'TOTAL LIABILITIES', data.liabilities.totalLiabilities.toString()],
            [],
            [locale === 'ar' ? 'حقوق الملكية' : 'EQUITY'],
            [locale === 'ar' ? 'رأس المال' : 'Capital', data.equity.capital.toString()],
            [locale === 'ar' ? 'الأرباح المحتجزة' : 'Retained Earnings', data.equity.retainedEarnings.toString()],
            [locale === 'ar' ? 'صافي ربح العام الحالي' : 'Current Year Profit', data.equity.currentYearProfit.toString()],
            [locale === 'ar' ? 'إجمالي حقوق الملكية' : 'TOTAL EQUITY', data.equity.totalEquity.toString()],
            [],
            [locale === 'ar' ? 'إجمالي الخصوم وحقوق الملكية' : 'TOTAL LIABILITIES & EQUITY', data.totalLiabilitiesAndEquity.toString()],
        ];

        const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `balance-sheet-${asOfDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [data, locale, asOfDate]);

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

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const SectionHeader = ({
        title,
        total,
        section,
        icon: Icon,
        variant = 'default'
    }: {
        title: string;
        total: number;
        section: string;
        icon: React.ElementType;
        variant?: 'default' | 'success' | 'danger';
    }) => {
        const colorClasses = {
            default: 'from-blue-500 to-indigo-600 text-blue-700 dark:text-blue-300',
            success: 'from-emerald-500 to-teal-600 text-emerald-700 dark:text-emerald-300',
            danger: 'from-red-500 to-rose-600 text-red-700 dark:text-red-300',
        };

        return (
            <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between py-3 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 bg-gradient-to-br ${colorClasses[variant].split(' ').slice(0, 2).join(' ')} rounded-lg`}>
                        {expandedSections.includes(section) ? (
                            <ChevronDown className="h-4 w-4 text-white" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-white" />
                        )}
                    </div>
                    <div className={`p-1.5 bg-gradient-to-br ${colorClasses[variant].split(' ').slice(0, 2).join(' ')} rounded-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                </div>
                <span className={`font-bold font-mono ${colorClasses[variant].split(' ').slice(2).join(' ')}`}>
                    {formatCurrency(total)}
                </span>
            </button>
        );
    };

    const LineItem = ({
        label,
        amount,
        indent = false,
        bold = false,
        isNegative = false
    }: {
        label: string;
        amount: number;
        indent?: boolean;
        bold?: boolean;
        isNegative?: boolean;
    }) => (
        <div className={`flex justify-between py-2.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-colors ${indent ? 'ms-8' : ''}`}>
            <span className={`text-slate-700 dark:text-slate-300 ${bold ? 'font-semibold' : ''}`}>{label}</span>
            <span className={`font-mono ${amount < 0 || isNegative ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'} ${bold ? 'font-semibold' : ''}`}>
                {isNegative && amount > 0 ? `(${formatCurrency(amount)})` : formatCurrency(amount)}
            </span>
        </div>
    );

    const TotalItem = ({
        label,
        amount,
        variant = 'primary'
    }: {
        label: string;
        amount: number;
        variant?: 'primary' | 'success' | 'danger' | 'purple';
    }) => {
        const colorClasses = {
            primary: 'from-blue-600/20 to-indigo-600/20 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
            success: 'from-emerald-600/20 to-teal-600/20 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800',
            danger: 'from-red-600/20 to-rose-600/20 dark:from-red-500/20 dark:to-rose-500/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
            purple: 'from-violet-600/20 to-purple-600/20 dark:from-violet-500/20 dark:to-purple-500/20 text-violet-900 dark:text-violet-100 border-violet-200 dark:border-violet-800',
        };

        return (
            <div className={`flex justify-between py-3 px-4 bg-gradient-to-r ${colorClasses[variant]} rounded-xl border font-bold`}>
                <span className="text-base">{label}</span>
                <span className="text-base font-mono">{formatCurrency(amount)}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <Scale className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                {locale === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {locale === 'ar' ? 'المركز المالي للشركة' : 'Financial Position Statement'}
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

                {/* Date Filter */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'حتى تاريخ' : 'As of Date'}
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        value={asOfDate}
                                        onChange={(e) => setAsOfDate(e.target.value)}
                                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={fetchData}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
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
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">
                                                {locale === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.assets.totalAssets)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-xl shadow-red-500/25">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-100 text-sm">
                                                {locale === 'ar' ? 'إجمالي الالتزامات' : 'Total Liabilities'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.liabilities.totalLiabilities)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl shadow-emerald-500/25">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-emerald-100 text-sm">
                                                {locale === 'ar' ? 'حقوق الملكية' : 'Total Equity'}
                                            </p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(data.equity.totalEquity)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Balance Check */}
                        <Card className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl ${data.assets.totalAssets === data.totalLiabilitiesAndEquity
                            ? 'border-emerald-500/50 shadow-emerald-500/10'
                            : 'border-red-500/50 shadow-red-500/10'
                            }`}>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-center gap-4">
                                    <Scale className={`h-6 w-6 ${data.assets.totalAssets === data.totalLiabilitiesAndEquity
                                        ? 'text-emerald-500'
                                        : 'text-red-500'
                                        }`} />
                                    <span className={`text-lg font-semibold ${data.assets.totalAssets === data.totalLiabilitiesAndEquity
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {data.assets.totalAssets === data.totalLiabilitiesAndEquity
                                            ? (locale === 'ar' ? '✓ الميزانية متوازنة' : '✓ Balance Sheet is Balanced')
                                            : (locale === 'ar' ? '✗ الميزانية غير متوازنة' : '✗ Balance Sheet is NOT Balanced')
                                        }
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Assets */}
                            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                                                {locale === 'ar' ? 'الأصول' : 'Assets'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                                {locale === 'ar' ? 'ما تمتلكه الشركة' : 'What the company owns'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {/* Current Assets */}
                                    <div>
                                        <SectionHeader
                                            title={locale === 'ar' ? 'الأصول المتداولة' : 'Current Assets'}
                                            total={data.assets.currentAssets.total}
                                            section="currentAssets"
                                            icon={Banknote}
                                            variant="success"
                                        />
                                        {expandedSections.includes('currentAssets') && (
                                            <div className="mt-2 space-y-1 border-s-2 border-emerald-200 dark:border-emerald-800 ms-4">
                                                <LineItem
                                                    label={locale === 'ar' ? 'النقدية والبنوك' : 'Cash & Bank'}
                                                    amount={data.assets.currentAssets.cash}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'العملاء (المدينون)' : 'Accounts Receivable'}
                                                    amount={data.assets.currentAssets.accountsReceivable}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'المخزون' : 'Inventory'}
                                                    amount={data.assets.currentAssets.inventory}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'مصروفات مدفوعة مقدماً' : 'Prepaid Expenses'}
                                                    amount={data.assets.currentAssets.prepaidExpenses}
                                                    indent
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Fixed Assets */}
                                    <div>
                                        <SectionHeader
                                            title={locale === 'ar' ? 'الأصول الثابتة' : 'Fixed Assets'}
                                            total={data.assets.fixedAssets.total}
                                            section="fixedAssets"
                                            icon={Landmark}
                                            variant="default"
                                        />
                                        {expandedSections.includes('fixedAssets') && (
                                            <div className="mt-2 space-y-1 border-s-2 border-blue-200 dark:border-blue-800 ms-4">
                                                <LineItem
                                                    label={locale === 'ar' ? 'الأصول والمعدات' : 'Property & Equipment'}
                                                    amount={data.assets.fixedAssets.propertyAndEquipment}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'مجمع الإهلاك' : 'Accumulated Depreciation'}
                                                    amount={data.assets.fixedAssets.accumulatedDepreciation}
                                                    indent
                                                    isNegative={data.assets.fixedAssets.accumulatedDepreciation > 0}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Assets */}
                                    <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                                        <TotalItem
                                            label={locale === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}
                                            amount={data.assets.totalAssets}
                                            variant="primary"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Liabilities & Equity */}
                            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                                            <Scale className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                                                {locale === 'ar' ? 'الالتزامات وحقوق الملكية' : 'Liabilities & Equity'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                                {locale === 'ar' ? 'ما تدين به الشركة وملكيتها' : 'What the company owes and ownership'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {/* Current Liabilities */}
                                    <div>
                                        <SectionHeader
                                            title={locale === 'ar' ? 'الالتزامات المتداولة' : 'Current Liabilities'}
                                            total={data.liabilities.currentLiabilities.total}
                                            section="currentLiabilities"
                                            icon={CreditCard}
                                            variant="danger"
                                        />
                                        {expandedSections.includes('currentLiabilities') && (
                                            <div className="mt-2 space-y-1 border-s-2 border-red-200 dark:border-red-800 ms-4">
                                                <LineItem
                                                    label={locale === 'ar' ? 'الموردون (الدائنون)' : 'Accounts Payable'}
                                                    amount={data.liabilities.currentLiabilities.accountsPayable}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'مصروفات مستحقة' : 'Accrued Expenses'}
                                                    amount={data.liabilities.currentLiabilities.accruedExpenses}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'قروض قصيرة الأجل' : 'Short-term Loans'}
                                                    amount={data.liabilities.currentLiabilities.shortTermLoans}
                                                    indent
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Long-term Liabilities */}
                                    <div>
                                        <SectionHeader
                                            title={locale === 'ar' ? 'الالتزامات طويلة الأجل' : 'Long-term Liabilities'}
                                            total={data.liabilities.longTermLiabilities.total}
                                            section="longTermLiabilities"
                                            icon={Wallet}
                                            variant="danger"
                                        />
                                        {expandedSections.includes('longTermLiabilities') && (
                                            <div className="mt-2 space-y-1 border-s-2 border-red-200 dark:border-red-800 ms-4">
                                                <LineItem
                                                    label={locale === 'ar' ? 'قروض طويلة الأجل' : 'Long-term Loans'}
                                                    amount={data.liabilities.longTermLiabilities.longTermLoans}
                                                    indent
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Equity */}
                                    <div>
                                        <SectionHeader
                                            title={locale === 'ar' ? 'حقوق الملكية' : 'Equity'}
                                            total={data.equity.totalEquity}
                                            section="equity"
                                            icon={PiggyBank}
                                            variant="success"
                                        />
                                        {expandedSections.includes('equity') && (
                                            <div className="mt-2 space-y-1 border-s-2 border-emerald-200 dark:border-emerald-800 ms-4">
                                                <LineItem
                                                    label={locale === 'ar' ? 'رأس المال' : 'Capital'}
                                                    amount={data.equity.capital}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'الأرباح المحتجزة' : 'Retained Earnings'}
                                                    amount={data.equity.retainedEarnings}
                                                    indent
                                                />
                                                <LineItem
                                                    label={locale === 'ar' ? 'ربح السنة الحالية' : 'Current Year Profit'}
                                                    amount={data.equity.currentYearProfit}
                                                    indent
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Liabilities & Equity */}
                                    <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                                        <TotalItem
                                            label={locale === 'ar' ? 'إجمالي الالتزامات وحقوق الملكية' : 'Total Liabilities & Equity'}
                                            amount={data.totalLiabilitiesAndEquity}
                                            variant="purple"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
