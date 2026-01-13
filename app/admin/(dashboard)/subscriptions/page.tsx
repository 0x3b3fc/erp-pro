'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/select';
import { Search, DollarSign, TrendingUp, Users, Building2, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  planType: string;
  status: string;
  createdAt: string;
  company: {
    nameAr: string;
    email: string;
  } | null;
}

interface SubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnedThisMonth: number;
  newThisMonth: number;
  byPlan: {
    plan: string;
    count: number;
    revenue: number;
  }[];
}

const planLabels: Record<string, string> = {
  STARTER: 'مجاني',
  GROWTH: 'النمو',
  BUSINESS: 'الأعمال',
  ENTERPRISE: 'المؤسسات',
};

const planPrices: Record<string, number> = {
  STARTER: 0,
  GROWTH: 2500,
  BUSINESS: 5000,
  ENTERPRISE: 10000,
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (planFilter !== 'all') params.set('planType', planFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/tenants?${params}`);
      const data = await res.json();

      if (data.success) {
        setTenants(data.data.tenants);
        
        // Calculate stats
        const activeTenants = data.data.tenants.filter((t: Tenant) => t.status === 'ACTIVE');
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlyRevenue = activeTenants.reduce((sum: number, t: Tenant) => {
          return sum + (planPrices[t.planType] || 0);
        }, 0);

        const byPlan = ['STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'].map((plan) => {
          const count = activeTenants.filter((t: Tenant) => t.planType === plan).length;
          return {
            plan,
            count,
            revenue: count * (planPrices[plan] || 0),
          };
        });

        setStats({
          totalRevenue: monthlyRevenue * 12, // Annual estimate
          monthlyRecurringRevenue: monthlyRevenue,
          activeSubscriptions: activeTenants.length,
          churnedThisMonth: 0, // TODO: Calculate from cancelled tenants this month
          newThisMonth: data.data.tenants.filter((t: Tenant) => 
            new Date(t.createdAt) >= thisMonth
          ).length,
          byPlan,
        });
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, planFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">الاشتراكات</h1>
        <p className="text-slate-400">إدارة اشتراكات الشركات والإيرادات</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                الإيراد الشهري المتكرر
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.monthlyRecurringRevenue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formatCurrency(stats.totalRevenue)} سنوياً (تقديري)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                الاشتراكات النشطة
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeSubscriptions}</div>
              <p className="text-xs text-slate-400 mt-1">اشتراك نشط</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                اشتراكات جديدة هذا الشهر
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.newThisMonth}</div>
              <p className="text-xs text-slate-400 mt-1">شركة جديدة</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                الإيراد المتوقع سنوياً
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">إجمالي سنوي</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue by Plan */}
      {stats && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">الإيرادات حسب الباقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.byPlan.map((item) => (
                <div key={item.plan} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400">{planLabels[item.plan]}</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {item.count} اشتراك
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="بحث بالاسم أو النطاق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="الباقة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الباقات</SelectItem>
            <SelectItem value="STARTER">مجاني</SelectItem>
            <SelectItem value="GROWTH">النمو</SelectItem>
            <SelectItem value="BUSINESS">الأعمال</SelectItem>
            <SelectItem value="ENTERPRISE">المؤسسات</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="ACTIVE">نشط</SelectItem>
            <SelectItem value="SUSPENDED">موقوف</SelectItem>
            <SelectItem value="CANCELLED">ملغي</SelectItem>
            <SelectItem value="TRIAL">تجريبي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Building2 className="h-12 w-12 mb-4" />
              <p>لا توجد اشتراكات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">الشركة</TableHead>
                  <TableHead className="text-slate-400">الباقة</TableHead>
                  <TableHead className="text-slate-400">السعر الشهري</TableHead>
                  <TableHead className="text-slate-400">الحالة</TableHead>
                  <TableHead className="text-slate-400">تاريخ البدء</TableHead>
                  <TableHead className="text-slate-400">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const monthlyPrice = planPrices[tenant.planType] || 0;
                  return (
                    <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">
                            {tenant.company?.nameAr || tenant.name}
                          </p>
                          <p className="text-sm text-slate-400">{tenant.subdomain}.erp.com</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {planLabels[tenant.planType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(monthlyPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tenant.status === 'ACTIVE'
                              ? 'default'
                              : tenant.status === 'SUSPENDED'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {tenant.status === 'ACTIVE'
                            ? 'نشط'
                            : tenant.status === 'SUSPENDED'
                            ? 'موقوف'
                            : tenant.status === 'CANCELLED'
                            ? 'ملغي'
                            : 'تجريبي'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-white"
                          onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="border-slate-600 text-slate-300"
        >
          السابق
        </Button>
        <span className="text-slate-400 px-4">صفحة {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          className="border-slate-600 text-slate-300"
        >
          التالي
        </Button>
      </div>
    </div>
  );
}
