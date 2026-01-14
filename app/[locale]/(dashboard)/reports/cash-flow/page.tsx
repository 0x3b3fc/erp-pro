'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Banknote,
    CircleDollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    ChevronRight,
    ChevronDown,
    PiggyBank,
    Landmark,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    const isRTL = locale === 'ar';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CashFlowData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<string>('month');
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [expandedSections, setExpandedSections] = useState<string[]>(['operating', 'investing', 'financing']);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/reports/cash-flow?period=${period}&year=${year}`);
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(locale === 'ar' ? 'غير مصرح. يرجى تسجيل الدخول أولاً.' : 'Unauthorized. Please login first.');
                }
                throw new Error(locale === 'ar' ? 'فشل في جلب بيانات التدفق النقدي' : 'Failed to fetch cash flow data');
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
            [locale === 'ar' ? 'قائمة التدفقات النقدية' : 'Cash Flow Statement'],
            [locale === 'ar' ? 'الفترة' : 'Period', data.period],
            [],
            [locale === 'ar' ? 'البند' : 'Item', locale === 'ar' ? 'المبلغ' : 'Amount'],
            [],
            [locale === 'ar' ? 'رصيد أول الفترة' : 'Opening Balance', data.openingBalance.toString()],
            [],
            [locale === 'ar' ? 'الأنشطة التشغيلية' : 'OPERATING ACTIVITIES'],
        ];

        data.operatingActivities.items.forEach(item => {
            rows.push([item.label, item.amount.toString()]);
        });
        rows.push([locale === 'ar' ? 'إجمالي الأنشطة التشغيلية' : 'Total Operating Activities', data.operatingActivities.total.toString()]);

        rows.push([]);
        rows.push([locale === 'ar' ? 'الأنشطة الاستثمارية' : 'INVESTING ACTIVITIES']);
        data.investingActivities.items.forEach(item => {
            rows.push([item.label, item.amount.toString()]);
        });
        rows.push([locale === 'ar' ? 'إجمالي الأنشطة الاستثمارية' : 'Total Investing Activities', data.investingActivities.total.toString()]);

        rows.push([]);
        rows.push([locale === 'ar' ? 'الأنشطة التمويلية' : 'FINANCING ACTIVITIES']);
        data.financingActivities.items.forEach(item => {
            rows.push([item.label, item.amount.toString()]);
        });
        rows.push([locale === 'ar' ? 'إجمالي الأنشطة التمويلية' : 'Total Financing Activities', data.financingActivities.total.toString()]);

        rows.push([]);
        rows.push([locale === 'ar' ? 'صافي التدفق النقدي' : 'NET CASH FLOW', data.netCashFlow.toString()]);
        rows.push([locale === 'ar' ? 'رصيد آخر الفترة' : 'Closing Balance', data.closingBalance.toString()]);

        const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cash-flow-${year}-${period}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [data, locale, year, period]);

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

    const getChangeIndicator = (current: number, previous?: number) => {
        if (!previous || previous === 0) return null;
        const change = ((current - previous) / Math.abs(previous)) * 100;
        if (change > 0) {
            return (
                <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {change.toFixed(1)}%
                </span>
            );
        } else if (change < 0) {
            return (
                <span className="flex items-center text-xs text-red-600 dark:text-red-400">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    {Math.abs(change).toFixed(1)}%
                </span>
            );
        }
        return null;
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
        variant?: 'default' | 'success' | 'danger' | 'warning';
    }) => {
        const colorClasses = {
            default: 'from-blue-500 to-indigo-600',
            success: 'from-emerald-500 to-teal-600',
            danger: 'from-red-500 to-rose-600',
            warning: 'from-amber-500 to-orange-600',
        };

        const textColors = {
            default: 'text-blue-700 dark:text-blue-300',
            success: 'text-emerald-700 dark:text-emerald-300',
            danger: 'text-red-700 dark:text-red-300',
            warning: 'text-amber-700 dark:text-amber-300',
        };

        return (
            <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between py-3 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 bg-gradient-to-br ${colorClasses[variant]} rounded-lg`}>
                        {expandedSections.includes(section) ? (
                            <ChevronDown className="h-4 w-4 text-white" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-white" />
                        )}
                    </div>
                    <div className={`p-1.5 bg-gradient-to-br ${colorClasses[variant]} rounded-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                </div>
                <span className={`font-bold font-mono ${total >= 0 ? textColors.success : textColors.danger}`}>
                    {formatCurrency(total)}
                </span>
            </button>
        );
    };

    const LineItem = ({
        label,
        amount,
        previousAmount,
    }: {
        label: string;
        amount: number;
        previousAmount?: number;
    }) => (
        <div className="flex justify-between items-center py-2.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-colors ms-8">
            <div className="flex items-center gap-2">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                {getChangeIndicator(amount, previousAmount)}
            </div>
            <span className={`font-mono ${amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)}
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
                <div className="max-w-5xl mx-auto">
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
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                            <ArrowRightLeft className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                {locale === 'ar' ? 'قائمة التدفقات النقدية' : 'Cash Flow Statement'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {locale === 'ar' ? 'تحليل حركة النقد' : 'Cash Movement Analysis'}
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

                {/* Filters */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[150px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'الفترة' : 'Period'}
                                </Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="month">{locale === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                                        <SelectItem value="quarter">{locale === 'ar' ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
                                        <SelectItem value="year">{locale === 'ar' ? 'سنوي' : 'Yearly'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[120px]">
                                <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1.5 block">
                                    {locale === 'ar' ? 'السنة' : 'Year'}
                                </Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2023, 2022, 2021, 2020].map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={fetchData}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0 shadow-xl shadow-slate-500/25">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-200 text-xs">
                                                {locale === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}
                                            </p>
                                            <p className="text-xl font-bold mt-1">
                                                {formatCurrency(data.openingBalance)}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-white/20 rounded-xl">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={`border-0 shadow-xl ${data.netCashFlow >= 0
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                                : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-xs ${data.netCashFlow >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                                                {locale === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}
                                            </p>
                                            <p className="text-xl font-bold mt-1">
                                                {formatCurrency(data.netCashFlow)}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-white/20 rounded-xl">
                                            {data.netCashFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-xs">
                                                {locale === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'}
                                            </p>
                                            <p className="text-xl font-bold mt-1">
                                                {formatCurrency(data.closingBalance)}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-white/20 rounded-xl">
                                            <Banknote className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-xl shadow-violet-500/25">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-violet-100 text-xs">
                                                {locale === 'ar' ? 'الفترة' : 'Period'}
                                            </p>
                                            <p className="text-lg font-bold mt-1">
                                                {data.period}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-white/20 rounded-xl">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cash Flow Details */}
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                                        <CircleDollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                                            {locale === 'ar' ? 'تفاصيل التدفقات النقدية' : 'Cash Flow Details'}
                                        </CardTitle>
                                        <CardDescription className="text-slate-500 dark:text-slate-400">
                                            {locale === 'ar' ? 'تحليل مصادر واستخدامات النقد' : 'Analysis of cash sources and uses'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Opening Balance */}
                                <TotalItem
                                    label={locale === 'ar' ? 'رصيد النقدية أول الفترة' : 'Opening Cash Balance'}
                                    amount={data.openingBalance}
                                    variant="primary"
                                />

                                {/* Operating Activities */}
                                <div>
                                    <SectionHeader
                                        title={data.operatingActivities.name || (locale === 'ar' ? 'الأنشطة التشغيلية' : 'Operating Activities')}
                                        total={data.operatingActivities.total}
                                        section="operating"
                                        icon={Building2}
                                        variant="success"
                                    />
                                    {expandedSections.includes('operating') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-emerald-200 dark:border-emerald-800 ms-4">
                                            {data.operatingActivities.items.map((item, index) => (
                                                <LineItem
                                                    key={index}
                                                    label={item.label}
                                                    amount={item.amount}
                                                    previousAmount={item.previousAmount}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Investing Activities */}
                                <div>
                                    <SectionHeader
                                        title={data.investingActivities.name || (locale === 'ar' ? 'الأنشطة الاستثمارية' : 'Investing Activities')}
                                        total={data.investingActivities.total}
                                        section="investing"
                                        icon={Landmark}
                                        variant="warning"
                                    />
                                    {expandedSections.includes('investing') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-amber-200 dark:border-amber-800 ms-4">
                                            {data.investingActivities.items.map((item, index) => (
                                                <LineItem
                                                    key={index}
                                                    label={item.label}
                                                    amount={item.amount}
                                                    previousAmount={item.previousAmount}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Financing Activities */}
                                <div>
                                    <SectionHeader
                                        title={data.financingActivities.name || (locale === 'ar' ? 'الأنشطة التمويلية' : 'Financing Activities')}
                                        total={data.financingActivities.total}
                                        section="financing"
                                        icon={PiggyBank}
                                        variant="default"
                                    />
                                    {expandedSections.includes('financing') && (
                                        <div className="mt-2 space-y-1 border-s-2 border-blue-200 dark:border-blue-800 ms-4">
                                            {data.financingActivities.items.map((item, index) => (
                                                <LineItem
                                                    key={index}
                                                    label={item.label}
                                                    amount={item.amount}
                                                    previousAmount={item.previousAmount}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Net Cash Flow */}
                                <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                                    <TotalItem
                                        label={locale === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}
                                        amount={data.netCashFlow}
                                        variant={data.netCashFlow >= 0 ? 'success' : 'danger'}
                                    />
                                </div>

                                {/* Closing Balance */}
                                <TotalItem
                                    label={locale === 'ar' ? 'رصيد النقدية آخر الفترة' : 'Closing Cash Balance'}
                                    amount={data.closingBalance}
                                    variant="purple"
                                />
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    );
}
