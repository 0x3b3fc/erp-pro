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
import { ArrowRight, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'مالك النظام',
  ADMIN: 'مدير',
  SUPPORT: 'دعم',
};

export default function AdminDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [lastLoginAt, setLastLoginAt] = useState('');

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setAdminId(id);

      try {
        const res = await fetch(`/api/admin/admins/${id}`);
        const data = await res.json();

        if (data.success) {
          const admin = data.data;
          setName(admin.name);
          setEmail(admin.email);
          setRole(admin.role);
          setIsActive(admin.isActive);
          setCreatedAt(new Date(admin.createdAt).toLocaleDateString('ar-EG'));
          setLastLoginAt(admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString('ar-EG') : '-');
        } else {
          toast.error('فشل تحميل بيانات المدير');
          router.push('/admin/users');
        }
      } catch (error) {
        toast.error('حدث خطأ');
        router.push('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name,
        email,
        role,
        isActive,
      };

      if (password) {
        updateData.password = password;
      }

      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم تحديث المدير بنجاح');
        setEditing(false);
        setPassword('');
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
    if (!confirm('هل أنت متأكد من حذف هذا المدير؟')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم حذف المدير بنجاح');
        router.push('/admin/users');
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
            <p className="text-slate-400">{email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setPassword(''); }}>
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

      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">معلومات المدير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">الاسم</Label>
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
            <Label className="text-slate-300">البريد الإلكتروني</Label>
            {editing ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            ) : (
              <p className="mt-1 text-white">{email}</p>
            )}
          </div>
          {editing && (
            <div>
              <Label className="text-slate-300">كلمة المرور الجديدة (اتركها فارغة للاحتفاظ بالقديمة)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="اتركها فارغة للاحتفاظ بالقديمة"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">الدور</Label>
              {editing ? (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">مدير</SelectItem>
                    <SelectItem value="SUPPORT">دعم</SelectItem>
                    <SelectItem value="SUPER_ADMIN">مالك النظام</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="mt-1 border-slate-600 text-slate-300">
                  {roleLabels[role]}
                </Badge>
              )}
            </div>
            <div>
              <Label className="text-slate-300">الحالة</Label>
              {editing ? (
                <Select
                  value={isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setIsActive(value === 'active')}
                >
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">موقوف</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={isActive ? 'default' : 'destructive'} className="mt-1">
                  {isActive ? 'نشط' : 'موقوف'}
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <Label className="text-slate-300">تاريخ الإنشاء</Label>
              <p className="mt-1 text-slate-300">{createdAt}</p>
            </div>
            <div>
              <Label className="text-slate-300">آخر دخول</Label>
              <p className="mt-1 text-slate-300">{lastLoginAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
