'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  SENT: 'default',
  PAID: 'default',
  PARTIALLY_PAID: 'secondary',
  OVERDUE: 'destructive',
  CANCELLED: 'destructive',
};

const monthNames = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      CONFIRMED: 'مؤكدة',
      SENT: 'مرسلة',
      PAID: 'مدفوعة',
      PARTIALLY_PAID: 'جزئية',
      OVERDUE: 'متأخرة',
      CANCELLED: 'ملغاة',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-48"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.welcome')}</h1>
          <p className="text-muted-foreground">{t('dashboard.overview')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 me-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.monthSales')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.sales.thisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من إجمالي {formatCurrency(stats?.sales.thisYear || 0)} هذا العام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalCustomers || 0}</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              {stats?.overview.newCustomersThisMonth || 0} عميل جديد هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalInvoices || 0}</div>
            <div className="flex gap-2 mt-2">
              {stats?.invoicesByStatus.DRAFT && (
                <Badge variant="secondary" className="text-xs">
                  {stats.invoicesByStatus.DRAFT} مسودة
                </Badge>
              )}
              {stats?.invoicesByStatus.OVERDUE && (
                <Badge variant="destructive" className="text-xs">
                  {stats.invoicesByStatus.OVERDUE} متأخرة
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalProducts || 0}</div>
            {stats?.overview.lowStockCount ? (
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.overview.lowStockCount} منتج مخزون منخفض
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">مخزون طبيعي</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              المبيعات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-2">
              {monthNames.map((month, index) => {
                const monthData = stats?.sales.monthlySales.find(
                  (m) => m.month === index + 1
                );
                const total = monthData?.total || 0;
                const maxSale = Math.max(
                  ...(stats?.sales.monthlySales.map((m) => m.total) || [1])
                );
                const height = maxSale > 0 ? (total / maxSale) * 160 : 0;

                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${Math.max(height, 4)}px` }}
                      title={formatCurrency(total)}
                    />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>أفضل العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topCustomers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد بيانات
                </p>
              )}
              {stats?.topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.invoiceCount} فاتورة
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-medium text-sm">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.recentInvoices')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/sales/invoices')}
            >
              عرض الكل
              <ArrowUpRight className="h-4 w-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد فواتير
                </p>
              )}
              {stats?.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-medium">{formatCurrency(invoice.total)}</p>
                    <Badge
                      variant={statusColors[invoice.status] as any}
                      className="text-xs"
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
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/sales/invoices/new')}
              >
                <FileText className="h-6 w-6" />
                <span>فاتورة جديدة</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/sales/customers/new')}
              >
                <Users className="h-6 w-6" />
                <span>عميل جديد</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/inventory/products/new')}
              >
                <Package className="h-6 w-6" />
                <span>منتج جديد</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/reports/sales')}
              >
                <TrendingUp className="h-6 w-6" />
                <span>تقرير المبيعات</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
