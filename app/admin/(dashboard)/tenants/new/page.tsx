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

export default function NewTenantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Tenant info
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [planType, setPlanType] = useState('STARTER');
  const [status, setStatus] = useState('ACTIVE');

  // Company info
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [commercialRegNumber, setCommercialRegNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Admin user
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminNameAr, setAdminNameAr] = useState('');
  const [adminNameEn, setAdminNameEn] = useState('');

  const handleSave = async () => {
    // Validation
    if (!name || !subdomain || !companyNameAr || !companyNameEn || !adminEmail || !adminPassword || !adminNameAr || !adminNameEn) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subdomain,
          planType,
          status,
          companyNameAr,
          companyNameEn,
          taxNumber,
          commercialRegNumber,
          address,
          phone,
          email,
          adminEmail,
          adminPassword,
          adminNameAr,
          adminNameEn,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('تم إنشاء الشركة بنجاح');
        router.push('/admin/tenants');
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
            <h1 className="text-2xl font-bold text-white">إضافة شركة جديدة</h1>
            <p className="text-slate-400">إنشاء شركة جديدة مع حساب مدير</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tenant Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">اسم الشركة *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="اسم الشركة"
              />
            </div>
            <div>
              <Label className="text-slate-300">النطاق الفرعي *</Label>
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="example"
              />
              <p className="text-xs text-slate-400 mt-1">
                {subdomain ? `${subdomain}.erp.com` : 'example.erp.com'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">الباقة</Label>
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
              </div>
              <div>
                <Label className="text-slate-300">الحالة</Label>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">تفاصيل الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">الاسم بالعربية *</Label>
              <Input
                value={companyNameAr}
                onChange={(e) => setCompanyNameAr(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="اسم الشركة بالعربية"
              />
            </div>
            <div>
              <Label className="text-slate-300">الاسم بالإنجليزية *</Label>
              <Input
                value={companyNameEn}
                onChange={(e) => setCompanyNameEn(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="Company Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">الرقم الضريبي</Label>
                <Input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="الرقم الضريبي"
                />
              </div>
              <div>
                <Label className="text-slate-300">السجل التجاري</Label>
                <Input
                  value={commercialRegNumber}
                  onChange={(e) => setCommercialRegNumber(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="السجل التجاري"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">العنوان</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                placeholder="عنوان الشركة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">الهاتف</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="رقم الهاتف"
                />
              </div>
              <div>
                <Label className="text-slate-300">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin User */}
        <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">حساب المدير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">الاسم بالعربية *</Label>
                <Input
                  value={adminNameAr}
                  onChange={(e) => setAdminNameAr(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="اسم المدير بالعربية"
                />
              </div>
              <div>
                <Label className="text-slate-300">الاسم بالإنجليزية *</Label>
                <Input
                  value={adminNameEn}
                  onChange={(e) => setAdminNameEn(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Admin Name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label className="text-slate-300">كلمة المرور *</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="6 أحرف على الأقل"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
