'use client';

import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAllTenants, startImpersonation } from '@/lib/auth/admin-actions';
import {
  Search,
  Eye,
  Users,
  FileText,
  MoreHorizontal,
  LogIn,
  Settings,
  Loader2,
  Plus,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  planType: string;
  status: string;
  createdAt: Date | string;
  company: {
    nameAr: string;
    nameEn: string;
    phone: string;
    email: string;
  } | null;
  _count: {
    users: number;
    invoices: number;
    customers: number;
  };
};

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'destructive',
  TRIAL: 'secondary',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف',
  CANCELLED: 'ملغي',
  TRIAL: 'تجريبي',
};

const planLabels: Record<string, string> = {
  STARTER: 'مجاني',
  GROWTH: 'النمو',
  BUSINESS: 'الأعمال',
  ENTERPRISE: 'المؤسسات',
};

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [impersonateDialog, setImpersonateDialog] = useState<{
    open: boolean;
    tenant: Tenant | null;
  }>({ open: false, tenant: null });
  const [impersonating, setImpersonating] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    const result = await getAllTenants(page, 20, search || undefined);
    if (result.success && result.data) {
      setTenants(result.data.tenants as Tenant[]);
      setTotalPages(result.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchTenants, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleImpersonate = async () => {
    if (!impersonateDialog.tenant) return;

    setImpersonating(true);
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    const admin = JSON.parse(adminSession);
    const result = await startImpersonation(admin.id, impersonateDialog.tenant.id);

    if (result.success) {
      toast.success(`تم الدخول كـ ${impersonateDialog.tenant.company?.nameAr || impersonateDialog.tenant.name}`);
      // Redirect to tenant dashboard
      router.push('/ar/dashboard');
    } else {
      toast.error(result.error || 'فشل الدخول');
    }

    setImpersonating(false);
    setImpersonateDialog({ open: false, tenant: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الشركات</h1>
          <p className="text-slate-400">عرض وإدارة جميع الشركات المسجلة</p>
        </div>
        <Button onClick={() => router.push('/admin/tenants/new')}>
          <Plus className="h-4 w-4 me-2" />
          إضافة شركة
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="بحث بالاسم أو النطاق الفرعي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

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
              <p>لا توجد شركات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">الشركة</TableHead>
                  <TableHead className="text-slate-400">النطاق الفرعي</TableHead>
                  <TableHead className="text-slate-400">الباقة</TableHead>
                  <TableHead className="text-slate-400">الحالة</TableHead>
                  <TableHead className="text-slate-400">المستخدمين</TableHead>
                  <TableHead className="text-slate-400">الفواتير</TableHead>
                  <TableHead className="text-slate-400">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">
                          {tenant.company?.nameAr || tenant.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {tenant.company?.email || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{tenant.subdomain}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {planLabels[tenant.planType] || tenant.planType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[tenant.status] || 'secondary'}>
                        {statusLabels[tenant.status] || tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tenant._count.users}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {tenant._count.invoices}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-white"
                          onClick={() => setImpersonateDialog({ open: true, tenant })}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-white"
                          onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="border-slate-600 text-slate-300"
          >
            السابق
          </Button>
          <span className="text-slate-400 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="border-slate-600 text-slate-300"
          >
            التالي
          </Button>
        </div>
      )}

      {/* Impersonate Dialog */}
      <Dialog open={impersonateDialog.open} onOpenChange={(open) => setImpersonateDialog({ open, tenant: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">الدخول كشركة</DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم تسجيل دخولك كمدير لهذه الشركة. يمكنك الخروج في أي وقت.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
              <Building2 className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium text-white">
                  {impersonateDialog.tenant?.company?.nameAr || impersonateDialog.tenant?.name}
                </p>
                <p className="text-sm text-slate-400">
                  {impersonateDialog.tenant?.subdomain}.erp.com
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImpersonateDialog({ open: false, tenant: null })}
              className="border-slate-600 text-slate-300"
            >
              إلغاء
            </Button>
            <Button onClick={handleImpersonate} disabled={impersonating}>
              {impersonating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <LogIn className="me-2 h-4 w-4" />
                  الدخول
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
