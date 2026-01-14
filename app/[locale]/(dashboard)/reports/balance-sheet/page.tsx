'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BalanceSheetData | null>(null);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedSections, setExpandedSections] = useState<string[]>(['currentAssets', 'fixedAssets', 'currentLiabilities', 'equity']);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/reports/balance-sheet?asOfDate=${asOfDate}`);
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
            // Set demo data
            setData({
                asOfDate: asOfDate,
                assets: {
                    currentAssets: {
                        cash: 500000,
                        accountsReceivable: 350000,
                        inventory: 750000,
                        prepaidExpenses: 50000,
                        total: 1650000,
                    },
                    fixedAssets: {
                        propertyAndEquipment: 1200000,
                        accumulatedDepreciation: -200000,
                        total: 1000000,
                    },
                    totalAssets: 2650000,
                },
                liabilities: {
                    currentLiabilities: {
                        accountsPayable: 280000,
                        accruedExpenses: 70000,
                        shortTermLoans: 100000,
                        total: 450000,
                    },
                    longTermLiabilities: {
                        longTermLoans: 400000,
                        total: 400000,
                    },
                    totalLiabilities: 850000,
                },
                equity: {
                    capital: 1000000,
                    retainedEarnings: 550000,
                    currentYearProfit: 250000,
                    totalEquity: 1800000,
                },
                totalLiabilitiesAndEquity: 2650000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [asOfDate]);

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));
        return (amount < 0 ? '(' : '') + formatted + (amount < 0 ? ')' : '') + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const SectionHeader = ({ title, total, section, color = 'primary' }: { title: string; total: number; section: string; color?: string }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
            <div className="flex items-center gap-2">
                {expandedSections.includes(section) ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-semibold">{title}</span>
            </div>
            <span className={`font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-primary'}`}>
                {formatCurrency(total)}
            </span>
        </button>
    );

    const LineItem = ({ label, amount, indent = false, bold = false }: { label: string; amount: number; indent?: boolean; bold?: boolean }) => (
        <div className={`flex justify-between py-2 ${indent ? 'ps-8' : 'ps-4'} ${bold ? 'font-semibold' : ''}`}>
            <span>{label}</span>
            <span className={amount < 0 ? 'text-red-600' : ''}>{formatCurrency(amount)}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar' ? 'المركز المالي للشركة' : 'Financial position of the company'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border p-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'حتى تاريخ:' : 'As of:'}
                        </span>
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
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
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.assets.totalAssets)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'إجمالي الالتزامات' : 'Total Liabilities'}
                                </CardTitle>
                                <Wallet className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(data.liabilities.totalLiabilities)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'حقوق الملكية' : 'Total Equity'}
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.equity.totalEquity)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Balance Check */}
                    <Card className={data.assets.totalAssets === data.totalLiabilitiesAndEquity ? 'border-green-500/50' : 'border-red-500/50'}>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-center gap-4">
                                <Scale className={`h-6 w-6 ${data.assets.totalAssets === data.totalLiabilitiesAndEquity ? 'text-green-500' : 'text-red-500'}`} />
                                <span className="text-lg font-semibold">
                                    {data.assets.totalAssets === data.totalLiabilitiesAndEquity
                                        ? (locale === 'ar' ? 'الميزانية متوازنة ✓' : 'Balance Sheet is Balanced ✓')
                                        : (locale === 'ar' ? 'الميزانية غير متوازنة ✗' : 'Balance Sheet is NOT Balanced ✗')
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Assets */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-500" />
                                    {locale === 'ar' ? 'الأصول' : 'Assets'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Assets */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'الأصول المتداولة' : 'Current Assets'}
                                        total={data.assets.currentAssets.total}
                                        section="currentAssets"
                                        color="green"
                                    />
                                    {expandedSections.includes('currentAssets') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-muted ms-4">
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
                                    />
                                    {expandedSections.includes('fixedAssets') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-muted ms-4">
                                            <LineItem
                                                label={locale === 'ar' ? 'الأصول والمعدات' : 'Property & Equipment'}
                                                amount={data.assets.fixedAssets.propertyAndEquipment}
                                                indent
                                            />
                                            <LineItem
                                                label={locale === 'ar' ? 'مجمع الإهلاك' : 'Accumulated Depreciation'}
                                                amount={data.assets.fixedAssets.accumulatedDepreciation}
                                                indent
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Total Assets */}
                                <div className="pt-4 border-t-2">
                                    <div className="flex justify-between py-3 px-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <span className="text-lg font-bold">{locale === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</span>
                                        <span className="text-lg font-bold text-blue-600">{formatCurrency(data.assets.totalAssets)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Liabilities & Equity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    {locale === 'ar' ? 'الالتزامات وحقوق الملكية' : 'Liabilities & Equity'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Liabilities */}
                                <div>
                                    <SectionHeader
                                        title={locale === 'ar' ? 'الالتزامات المتداولة' : 'Current Liabilities'}
                                        total={data.liabilities.currentLiabilities.total}
                                        section="currentLiabilities"
                                        color="red"
                                    />
                                    {expandedSections.includes('currentLiabilities') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-muted ms-4">
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
                                        color="red"
                                    />
                                    {expandedSections.includes('longTermLiabilities') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-muted ms-4">
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
                                        color="green"
                                    />
                                    {expandedSections.includes('equity') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-muted ms-4">
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
                                <div className="pt-4 border-t-2">
                                    <div className="flex justify-between py-3 px-4 bg-primary/10 rounded-lg">
                                        <span className="text-lg font-bold">
                                            {locale === 'ar' ? 'إجمالي الالتزامات وحقوق الملكية' : 'Total Liabilities & Equity'}
                                        </span>
                                        <span className="text-lg font-bold text-primary">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
