'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Search, Shield, Loader2 } from 'lucide-react';
import { getSystemAdmins } from '@/lib/auth/admin-actions';

type SystemAdmin = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'مالك النظام',
  ADMIN: 'مدير',
  SUPPORT: 'دعم',
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<SystemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAdmins = async () => {
    setLoading(true);
    const result = await getSystemAdmins(page, 20, search || undefined);
    if (result.success && result.data) {
      setAdmins(result.data.admins as SystemAdmin[]);
      setTotalPages(result.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchAdmins, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const formatDate = (value: Date | string | null) => {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مديري النظام</h1>
        <p className="text-slate-400">عرض وإدارة حسابات مديري النظام</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Shield className="h-12 w-12 mb-4" />
              <p>لا يوجد مديري نظام</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">الاسم</TableHead>
                  <TableHead className="text-slate-400">البريد</TableHead>
                  <TableHead className="text-slate-400">الدور</TableHead>
                  <TableHead className="text-slate-400">الحالة</TableHead>
                  <TableHead className="text-slate-400">آخر دخول</TableHead>
                  <TableHead className="text-slate-400">تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white font-medium">{admin.name}</TableCell>
                    <TableCell className="text-slate-300">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {roleLabels[admin.role] || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.isActive ? 'success' : 'destructive'}>
                        {admin.isActive ? 'نشط' : 'موقوف'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(admin.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-slate-300">
          <button
            className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </button>
          <span>{page} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
