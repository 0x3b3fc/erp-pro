'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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

const accountTypeLabels: Record<string, string> = {
  ASSET: 'الأصول',
  LIABILITY: 'الخصوم',
  EQUITY: 'حقوق الملكية',
  REVENUE: 'الإيرادات',
  EXPENSE: 'المصروفات',
};

const accountTypeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export default function TrialBalancePage() {
  const t = useTranslations();

  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(accountTypeOrder)
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        asOfDate,
        showZeroBalances: showZeroBalances.toString(),
        groupByType: 'true',
      });

      const res = await fetch(`/api/v1/reports/trial-balance?${params}`);
      const result = await res.json();

      if (result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [asOfDate, showZeroBalances]);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data) return;

    // Create CSV content
    let csv = 'كود الحساب,اسم الحساب,النوع,مدين,دائن,الرصيد\n';

    const accounts = data.accounts as Record<string, TrialBalanceRow[]>;
    for (const type of accountTypeOrder) {
      const rows = accounts[type] || [];
      for (const row of rows) {
        csv += `${row.code},"${row.nameAr}",${accountTypeLabels[row.accountType]},${row.debit},${row.credit},${row.balance}\n`;
      }
    }

    csv += `\nالإجمالي,,${data.totals.debit},${data.totals.credit}\n`;

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trial-balance-${asOfDate}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-2xl font-bold">ميزان المراجعة</h1>
          <p className="text-muted-foreground">
            تقرير ميزان المراجعة للحسابات المحاسبية
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4 me-2" />
            تصدير
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!data}>
            <Printer className="h-4 w-4 me-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ميزان المراجعة</h1>
        {data && (
          <>
            <p className="text-lg">{data.fiscalYear.name}</p>
            <p>حتى تاريخ {formatDate(data.asOfDate)}</p>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end print:hidden">
        <div className="space-y-2">
          <Label htmlFor="asOfDate">حتى تاريخ</Label>
          <Input
            id="asOfDate"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-[200px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="showZeroBalances"
            checked={showZeroBalances}
            onCheckedChange={setShowZeroBalances}
          />
          <Label htmlFor="showZeroBalances">إظهار الأرصدة الصفرية</Label>
        </div>

        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'جاري التحميل...' : 'تحديث'}
        </Button>
      </div>

      {/* Balance Status */}
      {data && (
        <div className={`p-4 rounded-lg border ${data.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {data.isBalanced ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">
                  الميزان متوازن - مجموع المدين يساوي مجموع الدائن
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-700">
                  الميزان غير متوازن - يوجد فرق {formatCurrency(Math.abs(data.totals.debit - data.totals.credit))}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary by Type */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
          {accountTypeOrder.map((type) => {
            const summary = data.summaryByType[type];
            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {accountTypeLabels[type]}
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(summary.balance)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trial Balance Table */}
      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد بيانات
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">كود الحساب</TableHead>
                <TableHead>اسم الحساب</TableHead>
                <TableHead className="text-end w-[150px]">مدين</TableHead>
                <TableHead className="text-end w-[150px]">دائن</TableHead>
                <TableHead className="text-end w-[150px]">الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountTypeOrder.map((type) => {
                const accounts = data.accounts as Record<string, TrialBalanceRow[]>;
                const rows = accounts[type] || [];
                const isExpanded = expandedTypes.has(type);
                const summary = data.summaryByType[type];

                if (rows.length === 0 && !showZeroBalances) return null;

                return (
                  <>
                    {/* Type Header Row */}
                    <TableRow
                      key={`type-${type}`}
                      className="bg-muted/50 cursor-pointer hover:bg-muted print:bg-gray-100"
                      onClick={() => toggleType(type)}
                    >
                      <TableCell colSpan={2} className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="print:hidden">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                          {accountTypeLabels[type]}
                          <Badge variant="outline" className="ms-2">
                            {rows.length} حساب
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-end font-mono font-semibold">
                        {formatCurrency(summary.debit)}
                      </TableCell>
                      <TableCell className="text-end font-mono font-semibold">
                        {formatCurrency(summary.credit)}
                      </TableCell>
                      <TableCell className="text-end font-mono font-semibold">
                        {formatCurrency(summary.balance)}
                      </TableCell>
                    </TableRow>

                    {/* Account Rows */}
                    {(isExpanded || true) && // Always show in print
                      rows.map((row) => (
                        <TableRow
                          key={row.accountId}
                          className={`${!isExpanded ? 'hidden print:table-row' : ''}`}
                        >
                          <TableCell className="font-mono ps-8">
                            {row.code}
                          </TableCell>
                          <TableCell>{row.nameAr}</TableCell>
                          <TableCell className="text-end font-mono">
                            {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-end font-mono">
                            {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                          </TableCell>
                          <TableCell
                            className={`text-end font-mono ${
                              row.balance < 0 ? 'text-red-600' : ''
                            }`}
                          >
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary/5 font-bold">
                <TableCell colSpan={2}>الإجمالي العام</TableCell>
                <TableCell className="text-end font-mono">
                  {formatCurrency(data.totals.debit)}
                </TableCell>
                <TableCell className="text-end font-mono">
                  {formatCurrency(data.totals.credit)}
                </TableCell>
                <TableCell className="text-end font-mono">
                  {data.isBalanced ? (
                    <Badge variant="default">متوازن</Badge>
                  ) : (
                    <span className="text-red-600">
                      فرق: {formatCurrency(Math.abs(data.totals.debit - data.totals.credit))}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block mt-8 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</span>
          <span>تم إنشاؤه بواسطة نظام ERP</span>
        </div>
      </div>
    </div>
  );
}
