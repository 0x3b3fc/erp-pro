'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'مالك النظام',
  ADMIN: 'مدير',
  SUPPORT: 'دعم',
};

export default function NewAdminPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [isActive, setIsActive] = useState(true);

  const handleSave = async () => {
    if (!name || !email || !password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم إنشاء مدير النظام بنجاح');
        router.push('/admin/users');
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">إضافة مدير نظام جديد</h1>
            <p className="text-slate-400">إنشاء حساب مدير نظام جديد</p>
          </div>
        </div>
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
      </div>

      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">معلومات المدير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">الاسم *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              placeholder="اسم المدير"
            />
          </div>
          <div>
            <Label className="text-slate-300">البريد الإلكتروني *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <Label className="text-slate-300">كلمة المرور *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              placeholder="6 أحرف على الأقل"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">الدور</Label>
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
            </div>
            <div>
              <Label className="text-slate-300">الحالة</Label>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
