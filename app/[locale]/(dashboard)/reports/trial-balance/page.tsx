'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Scale,
  BarChart3,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface TrialBalanceRow {
  accountId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceData {
  fiscalYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  asOfDate: string;
  accounts: Record<string, TrialBalanceRow[]> | TrialBalanceRow[];
  totals: {
    debit: number;
    credit: number;
  };
  summaryByType: Record<string, { debit: number; credit: number; balance: number }>;
  isBalanced: boolean;
}

const accountTypeLabels: Record<string, { ar: string; en: string }> = {
  ASSET: { ar: 'الأصول', en: 'Assets' },
  LIABILITY: { ar: 'الخصوم', en: 'Liabilities' },
  EQUITY: { ar: 'حقوق الملكية', en: 'Equity' },
  REVENUE: { ar: 'الإيرادات', en: 'Revenue' },
  EXPENSE: { ar: 'المصروفات', en: 'Expenses' },
};

const accountTypeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const getAccountTypeIcon = (type: string) => {
  switch (type) {
    case 'ASSET': return Building2;
    case 'LIABILITY': return CreditCard;
    case 'EQUITY': return PiggyBank;
    case 'REVENUE': return TrendingUp;
    case 'EXPENSE': return TrendingDown;
    default: return BarChart3;
  }
};

const getAccountTypeColor = (type: string) => {
  switch (type) {
    case 'ASSET': return 'from-blue-500 to-indigo-600';
    case 'LIABILITY': return 'from-red-500 to-rose-600';
    case 'EQUITY': return 'from-emerald-500 to-teal-600';
    case 'REVENUE': return 'from-violet-500 to-purple-600';
    case 'EXPENSE': return 'from-amber-500 to-orange-600';
    default: return 'from-slate-500 to-slate-600';
  }
};

export default function TrialBalancePage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(accountTypeOrder)
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/reports/trial-balance?asOfDate=${asOfDate}`);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(locale === 'ar' ? 'غير مصرح. يرجى تسجيل الدخول أولاً.' : 'Unauthorized. Please login first.');
        }
        throw new Error(locale === 'ar' ? 'فشل في جلب بيانات ميزان المراجعة' : 'Failed to fetch trial balance data');
      }
      const result = await res.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const getAccountsByTypeHelper = useCallback((): Record<string, TrialBalanceRow[]> => {
    if (!data) return {};

    if (Array.isArray(data.accounts)) {
      const grouped: Record<string, TrialBalanceRow[]> = {};
      data.accounts.forEach(account => {
        if (!grouped[account.accountType]) {
          grouped[account.accountType] = [];
        }
        grouped[account.accountType].push(account);
      });
      return grouped;
    }

    return data.accounts;
  }, [data]);

  const exportToCSV = useCallback(() => {
    if (!data) return;

    const accountsByType = getAccountsByTypeHelper();
    const headers = [
      locale === 'ar' ? 'الكود' : 'Code',
      locale === 'ar' ? 'اسم الحساب' : 'Account Name',
      locale === 'ar' ? 'نوع الحساب' : 'Account Type',
      locale === 'ar' ? 'مدين' : 'Debit',
      locale === 'ar' ? 'دائن' : 'Credit',
    ];

    const rows: string[][] = [headers];

    accountTypeOrder.forEach(type => {
      const accounts = accountsByType[type] || [];
      accounts.forEach(account => {
        rows.push([
          account.code,
          locale === 'ar' ? account.nameAr : account.nameEn,
          accountTypeLabels[type]?.[locale === 'ar' ? 'ar' : 'en'] || type,
          account.debit.toString(),
          account.credit.toString(),
        ]);
      });
    });

    // Add totals
    rows.push([]);
    rows.push([
      '',
      locale === 'ar' ? 'الإجمالي' : 'Total',
      '',
      data.totals.debit.toString(),
      data.totals.credit.toString(),
    ]);

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trial-balance-${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data, locale, asOfDate, getAccountsByTypeHelper]);

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // Use the helper for rendering
  const getAccountsByType = getAccountsByTypeHelper;

  const filterAccounts = (accounts: TrialBalanceRow[]) => {
    if (showZeroBalances) return accounts;
    return accounts.filter(a => a.debit !== 0 || a.credit !== 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const accountsByType = getAccountsByType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {locale === 'ar' ? 'التحقق من توازن القيود المحاسبية' : 'Verify accounting entries balance'}
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
              <div className="flex items-center gap-2">
                <Switch
                  checked={showZeroBalances}
                  onCheckedChange={setShowZeroBalances}
                  id="zero-balances"
                />
                <Label htmlFor="zero-balances" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  {locale === 'ar' ? 'إظهار الأرصدة الصفرية' : 'Show Zero Balances'}
                </Label>
              </div>
              <Button
                onClick={fetchData}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
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
            {/* Balance Status */}
            <Card className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl ${data.isBalanced
              ? 'border-emerald-500/50 shadow-emerald-500/10'
              : 'border-red-500/50 shadow-red-500/10'
              }`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-4">
                  {data.isBalanced ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  <span className={`text-lg font-semibold ${data.isBalanced
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                    }`}>
                    {data.isBalanced
                      ? (locale === 'ar' ? '✓ ميزان المراجعة متوازن' : '✓ Trial Balance is Balanced')
                      : (locale === 'ar' ? '✗ ميزان المراجعة غير متوازن' : '✗ Trial Balance is NOT Balanced')
                    }
                  </span>
                </div>
                <div className="flex justify-center gap-8 mt-3 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      {locale === 'ar' ? 'إجمالي المدين' : 'Total Debit'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrency(data.totals.debit)} {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      {locale === 'ar' ? 'إجمالي الدائن' : 'Total Credit'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrency(data.totals.credit)} {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      {locale === 'ar' ? 'الفرق' : 'Difference'}
                    </p>
                    <p className={`font-bold font-mono ${data.totals.debit - data.totals.credit === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}>
                      {formatCurrency(Math.abs(data.totals.debit - data.totals.credit))} {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trial Balance Table */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                      {locale === 'ar' ? 'تفاصيل ميزان المراجعة' : 'Trial Balance Details'}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? `حتى ${new Date(asOfDate).toLocaleDateString('ar-EG')}`
                        : `As of ${new Date(asOfDate).toLocaleDateString()}`
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-24">
                          {locale === 'ar' ? 'الكود' : 'Code'}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          {locale === 'ar' ? 'اسم الحساب' : 'Account Name'}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                          {locale === 'ar' ? 'مدين' : 'Debit'}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                          {locale === 'ar' ? 'دائن' : 'Credit'}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountTypeOrder.map(type => {
                        const accounts = filterAccounts(accountsByType[type] || []);
                        if (accounts.length === 0) return null;

                        const Icon = getAccountTypeIcon(type);
                        const colorClass = getAccountTypeColor(type);
                        const isExpanded = expandedTypes.has(type);
                        const typeTotal = accounts.reduce(
                          (acc, a) => ({
                            debit: acc.debit + a.debit,
                            credit: acc.credit + a.credit
                          }),
                          { debit: 0, credit: 0 }
                        );

                        return (
                          <React.Fragment key={type}>
                            <TableRow
                              className="bg-slate-100 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => toggleType(type)}
                            >
                              <TableCell colSpan={2}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 bg-gradient-to-br ${colorClass} rounded-lg`}>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-white" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <div className={`p-1.5 bg-gradient-to-br ${colorClass} rounded-lg`}>
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {locale === 'ar' ? accountTypeLabels[type]?.ar : accountTypeLabels[type]?.en}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {accounts.length}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold font-mono text-slate-700 dark:text-slate-200">
                                {formatCurrency(typeTotal.debit)}
                              </TableCell>
                              <TableCell className="text-right font-bold font-mono text-slate-700 dark:text-slate-200">
                                {formatCurrency(typeTotal.credit)}
                              </TableCell>
                            </TableRow>
                            {isExpanded && accounts.map(account => (
                              <TableRow
                                key={account.accountId}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-sm ps-10">
                                  {account.code}
                                </TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300">
                                  {locale === 'ar' ? account.nameAr : account.nameEn}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                                  {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                                  {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-500/20 dark:to-purple-500/20 border-t-2 border-indigo-200 dark:border-indigo-800">
                        <TableCell colSpan={2} className="font-bold text-slate-800 dark:text-slate-100">
                          {locale === 'ar' ? 'الإجمالي' : 'Total'}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-indigo-700 dark:text-indigo-300 text-base">
                          {formatCurrency(data.totals.debit)}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-indigo-700 dark:text-indigo-300 text-base">
                          {formatCurrency(data.totals.credit)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
