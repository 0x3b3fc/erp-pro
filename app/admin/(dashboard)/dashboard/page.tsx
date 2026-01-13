'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemStats } from '@/lib/auth/admin-actions';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';

type SystemStats = {
  tenants: number;
  activeTenantsCount: number;
  users: number;
  invoices: number;
  invoicesTotal: number;
  tenantsByPlan: { plan: string; count: number }[];
};

const planLabels: Record<string, string> = {
  STARTER: 'مجاني',
  GROWTH: 'النمو',
  BUSINESS: 'الأعمال',
  ENTERPRISE: 'المؤسسات',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getSystemStats();
      if (result.success && result.data) {
        setStats(result.data as SystemStats);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-slate-400">نظرة عامة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              إجمالي الشركات
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.tenants || 0}</div>
            <p className="text-xs text-slate-400">
              {stats?.activeTenantsCount || 0} نشط
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              إجمالي المستخدمين
            </CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.users || 0}</div>
            <p className="text-xs text-slate-400">مستخدم مسجل</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              إجمالي الفواتير
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.invoices || 0}</div>
            <p className="text-xs text-slate-400">فاتورة</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              إجمالي المبيعات
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                maximumFractionDigits: 0,
              }).format(Number(stats?.invoicesTotal) || 0)}
            </div>
            <p className="text-xs text-slate-400">إجمالي</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">توزيع الباقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.tenantsByPlan.map((item) => (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.plan === 'STARTER' ? 'bg-slate-500' :
                      item.plan === 'GROWTH' ? 'bg-blue-500' :
                      item.plan === 'BUSINESS' ? 'bg-emerald-500' :
                      'bg-purple-500'
                    }`} />
                    <span className="text-slate-300">
                      {planLabels[item.plan] || item.plan}
                    </span>
                  </div>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">نشاط النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-white font-medium">النظام يعمل بشكل طبيعي</p>
                  <p className="text-sm text-slate-400">جميع الخدمات متاحة</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">وقت التشغيل</span>
                  <span className="text-emerald-400">99.9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
