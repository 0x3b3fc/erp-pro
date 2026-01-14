'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  DollarSign,
  Users,
  Package,
  FileText,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShoppingCart,
  Wallet,
  BarChart3,
  PieChart,
  Receipt,
  Store,
  CalendarDays,
  Clock,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  overview: {
    totalInvoices: number;
    totalCustomers: number;
    totalProducts: number;
    newCustomersThisMonth: number;
    lowStockCount: number;
  };
  sales: {
    thisMonth: number;
    thisYear: number;
    monthlySales: Array<{ month: number; total: number }>;
  };
  invoicesByStatus: Record<string, number>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    total: number;
    status: string;
    etaStatus: string | null;
    customerName: string;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  CONFIRMED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  SENT: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  PAID: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  PARTIALLY_PAID: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  OVERDUE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-500' },
};

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(num);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      DRAFT: { ar: 'مسودة', en: 'Draft' },
      CONFIRMED: { ar: 'مؤكدة', en: 'Confirmed' },
      SENT: { ar: 'مرسلة', en: 'Sent' },
      PAID: { ar: 'مدفوعة', en: 'Paid' },
      PARTIALLY_PAID: { ar: 'جزئية', en: 'Partial' },
      OVERDUE: { ar: 'متأخرة', en: 'Overdue' },
      CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
    };
    return locale === 'ar' ? labels[status]?.ar : labels[status]?.en || status;
  };

  const currentMonth = locale === 'ar' ? monthNames.ar[new Date().getMonth()] : monthNames.en[new Date().getMonth()];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {currentMonth} {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <Button
            onClick={fetchStats}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {error ? (
          <Card className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={fetchStats} variant="outline" className="mt-4">
                {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Monthly Sales */}
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl shadow-emerald-500/25">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">
                        {locale === 'ar' ? 'مبيعات الشهر' : 'Monthly Sales'}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(stats?.sales.thisMonth || 0)}
                      </p>
                      <p className="text-emerald-100 text-xs mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {locale === 'ar' ? 'من' : 'of'} {formatCurrency(stats?.sales.thisYear || 0)} {locale === 'ar' ? 'سنوي' : 'yearly'}
                      </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customers */}
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">
                        {locale === 'ar' ? 'العملاء' : 'Customers'}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(stats?.overview.totalCustomers || 0)}
                      </p>
                      <p className="text-emerald-200 text-xs mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +{stats?.overview.newCustomersThisMonth || 0} {locale === 'ar' ? 'جديد' : 'new'}
                      </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-xl shadow-violet-500/25">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-100 text-sm">
                        {locale === 'ar' ? 'الفواتير' : 'Invoices'}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(stats?.overview.totalInvoices || 0)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {stats?.invoicesByStatus.DRAFT && stats.invoicesByStatus.DRAFT > 0 && (
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                            {stats.invoicesByStatus.DRAFT} {locale === 'ar' ? 'مسودة' : 'draft'}
                          </span>
                        )}
                        {stats?.invoicesByStatus.OVERDUE && stats.invoicesByStatus.OVERDUE > 0 && (
                          <span className="text-xs bg-red-500/50 px-2 py-0.5 rounded">
                            {stats.invoicesByStatus.OVERDUE} {locale === 'ar' ? 'متأخر' : 'overdue'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Receipt className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl shadow-amber-500/25">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">
                        {locale === 'ar' ? 'المنتجات' : 'Products'}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(stats?.overview.totalProducts || 0)}
                      </p>
                      {stats?.overview.lowStockCount && stats.overview.lowStockCount > 0 ? (
                        <p className="text-red-200 text-xs mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {stats.overview.lowStockCount} {locale === 'ar' ? 'مخزون منخفض' : 'low stock'}
                        </p>
                      ) : (
                        <p className="text-amber-100 text-xs mt-2">
                          {locale === 'ar' ? 'مخزون طبيعي' : 'Normal stock'}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Monthly Sales Chart */}
              <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                        {locale === 'ar' ? 'المبيعات الشهرية' : 'Monthly Sales'}
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? 'أداء المبيعات خلال العام' : 'Sales performance this year'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[220px] flex items-end gap-2">
                    {(locale === 'ar' ? monthNames.ar : monthNames.en).map((month, index) => {
                      const monthData = stats?.sales.monthlySales.find(
                        (m) => m.month === index + 1
                      );
                      const total = monthData?.total || 0;
                      const maxSale = Math.max(
                        ...(stats?.sales.monthlySales.map((m) => m.total) || [1])
                      );
                      const height = maxSale > 0 ? (total / maxSale) * 180 : 0;

                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-lg transition-all hover:from-emerald-500 hover:to-teal-400 cursor-pointer relative group"
                            style={{ height: `${Math.max(height, 8)}px` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {formatCurrency(total)}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center font-medium">
                            {month.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                      {locale === 'ar' ? 'أفضل العملاء' : 'Top Customers'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {(!stats?.topCustomers || stats.topCustomers.length === 0) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                        {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                      </p>
                    )}
                    {stats?.topCustomers.map((customer, index) => (
                      <div
                        key={customer.customerId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/sales/customers/${customer.customerId}`)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                            : index === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                              : index === 2
                                ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-slate-800 dark:text-slate-200">{customer.customerName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {customer.invoiceCount} {locale === 'ar' ? 'فاتورة' : 'invoices'}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatCurrency(customer.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Invoices */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                      {locale === 'ar' ? 'أحدث الفواتير' : 'Recent Invoices'}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${locale}/sales/invoices`)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    {locale === 'ar' ? 'عرض الكل' : 'View All'}
                    <ArrowUpRight className="w-4 h-4 ms-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                        {locale === 'ar' ? 'لا توجد فواتير' : 'No invoices'}
                      </p>
                    )}
                    {stats?.recentInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        onClick={() => router.push(`/${locale}/sales/invoices/${invoice.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Receipt className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {invoice.customerName}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total)}</p>
                          <Badge
                            className={`text-xs ${statusColors[invoice.status]?.bg} ${statusColors[invoice.status]?.text} border-0`}
                          >
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                      {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                      onClick={() => router.push(`/${locale}/sales/invoices/new`)}
                    >
                      <FileText className="h-6 w-6" />
                      <span>{locale === 'ar' ? 'فاتورة جديدة' : 'New Invoice'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 text-blue-700 dark:text-blue-300"
                      onClick={() => router.push(`/${locale}/sales/customers/new`)}
                    >
                      <Users className="h-6 w-6" />
                      <span>{locale === 'ar' ? 'عميل جديد' : 'New Customer'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 text-amber-700 dark:text-amber-300"
                      onClick={() => router.push(`/${locale}/inventory/products/new`)}
                    >
                      <Package className="h-6 w-6" />
                      <span>{locale === 'ar' ? 'منتج جديد' : 'New Product'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 text-violet-700 dark:text-violet-300"
                      onClick={() => router.push(`/${locale}/reports/income-statement`)}
                    >
                      <TrendingUp className="h-6 w-6" />
                      <span>{locale === 'ar' ? 'التقارير' : 'Reports'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
