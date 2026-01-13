'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Save, Loader2, Trash2, Eye, Users, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';

const planLabels: Record<string, string> = {
  STARTER: 'مجاني',
  GROWTH: 'النمو',
  BUSINESS: 'الأعمال',
  ENTERPRISE: 'المؤسسات',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف',
  CANCELLED: 'ملغي',
  TRIAL: 'تجريبي',
};

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Tenant info
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [planType, setPlanType] = useState('STARTER');
  const [status, setStatus] = useState('ACTIVE');
  const [createdAt, setCreatedAt] = useState('');

  // Stats
  const [stats, setStats] = useState({
    users: 0,
    invoices: 0,
    customers: 0,
    suppliers: 0,
    products: 0,
  });

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setTenantId(id);

        const res = await fetch(`/api/admin/tenants/${id}`);
        const data = await res.json();

        if (data.success) {
          const tenant = data.data;
          setName(tenant.name);
          setSubdomain(tenant.subdomain);
          setPlanType(tenant.planType);
          setStatus(tenant.status);
          setCreatedAt(new Date(tenant.createdAt).toLocaleDateString('ar-EG'));
          setStats({
            users: tenant._count.users,
            invoices: tenant._count.invoices,
            customers: tenant._count.customers,
            suppliers: tenant._count.suppliers || 0,
            products: tenant._count.products || 0,
          });
        } else {
          toast.error('فشل تحميل بيانات الشركة');
          router.push('/admin/tenants');
        }
      } catch (error) {
        toast.error('حدث خطأ');
        router.push('/admin/tenants');
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subdomain,
          planType,
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم تحديث الشركة بنجاح');
        setEditing(false);
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع البيانات المرتبطة بها.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم حذف الشركة بنجاح');
        router.push('/admin/tenants');
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-slate-400">{subdomain}.erp.com</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 me-2" />
                    حفظ
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                تعديل
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 me-2" />
                حذف
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tenant Info */}
        <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">اسم الشركة</Label>
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              ) : (
                <p className="mt-1 text-white">{name}</p>
              )}
            </div>
            <div>
              <Label className="text-slate-300">النطاق الفرعي</Label>
              {editing ? (
                <Input
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              ) : (
                <p className="mt-1 text-white">{subdomain}.erp.com</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">الباقة</Label>
                {editing ? (
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">مجاني</SelectItem>
                      <SelectItem value="GROWTH">النمو</SelectItem>
                      <SelectItem value="BUSINESS">الأعمال</SelectItem>
                      <SelectItem value="ENTERPRISE">المؤسسات</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="mt-1 border-slate-600 text-slate-300">
                    {planLabels[planType]}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="text-slate-300">الحالة</Label>
                {editing ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">نشط</SelectItem>
                      <SelectItem value="SUSPENDED">موقوف</SelectItem>
                      <SelectItem value="CANCELLED">ملغي</SelectItem>
                      <SelectItem value="TRIAL">تجريبي</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'} className="mt-1">
                    {statusLabels[status]}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-slate-300">تاريخ الإنشاء</Label>
              <p className="mt-1 text-slate-300">{createdAt}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">المستخدمين</span>
              </div>
              <span className="text-white font-bold">{stats.users}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">الفواتير</span>
              </div>
              <span className="text-white font-bold">{stats.invoices}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">العملاء</span>
              </div>
              <span className="text-white font-bold">{stats.customers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">المنتجات</span>
              </div>
              <span className="text-white font-bold">{stats.products}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
