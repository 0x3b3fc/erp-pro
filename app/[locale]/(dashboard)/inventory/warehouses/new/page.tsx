'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewWarehousePage() {
  const t = useTranslations();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code.trim()) {
      alert('يرجى إدخال كود المخزن');
      return;
    }
    if (!nameAr.trim()) {
      alert('يرجى إدخال اسم المخزن بالعربية');
      return;
    }
    if (!nameEn.trim()) {
      alert('يرجى إدخال اسم المخزن بالإنجليزية');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          nameAr,
          nameEn,
          address: address || null,
          isDefault,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/inventory/warehouses');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">مخزن جديد</h1>
            <p className="text-muted-foreground">إنشاء مخزن جديد</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المخزن</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">الكود *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: WH-001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="isDefault">المخزن الافتراضي</Label>
              <div className="flex items-center gap-2 mt-1">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  {isDefault ? 'نعم' : 'لا'}
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameAr">الاسم بالعربية *</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم المخزن بالعربية"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nameEn">الاسم بالإنجليزية *</Label>
              <Input
                id="nameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Warehouse Name"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="عنوان المخزن"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="isActive">الحالة</Label>
            <div className="flex items-center gap-2 mt-1">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {isActive ? 'نشط' : 'غير نشط'}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
