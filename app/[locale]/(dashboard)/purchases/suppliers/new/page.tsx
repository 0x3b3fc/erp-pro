'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function NewSupplierPage() {
  const t = useTranslations();
  const router = useRouter();

  // Form state
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [supplierType, setSupplierType] = useState('BUSINESS');
  const [taxNumber, setTaxNumber] = useState('');
  const [commercialReg, setCommercialReg] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('0');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Generate supplier code
  const generateCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setCode(`SUP-${random}`);
  };

  // Save supplier
  const handleSave = async () => {
    if (!code.trim()) {
      alert('كود المورد مطلوب');
      return;
    }
    if (!nameAr.trim()) {
      alert('اسم المورد بالعربية مطلوب');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/purchases/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          supplierType,
          taxNumber: taxNumber.trim() || undefined,
          commercialReg: commercialReg.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          governorate: governorate.trim() || undefined,
          city: city.trim() || undefined,
          paymentTerms: parseInt(paymentTerms) || 0,
          notes: notes.trim() || undefined,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/purchases/suppliers');
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">مورد جديد</h1>
            <p className="text-muted-foreground">إضافة مورد جديد للنظام</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>كود المورد *</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SUP-001"
                  className="font-mono"
                />
                <Button type="button" variant="secondary" onClick={generateCode}>
                  توليد
                </Button>
              </div>
            </div>

            <div>
              <Label>الاسم بالعربية *</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم المورد"
              />
            </div>

            <div>
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Supplier Name"
                dir="ltr"
              />
            </div>

            <div>
              <Label>نوع المورد</Label>
              <Select value={supplierType} onValueChange={setSupplierType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">شركة</SelectItem>
                  <SelectItem value="INDIVIDUAL">فرد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>حالة المورد</Label>
                <p className="text-sm text-muted-foreground">المورد النشط يظهر في المشتريات</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardContent>
        </Card>

        {/* Tax Info */}
        <Card>
          <CardHeader>
            <CardTitle>البيانات الضريبية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('sales.taxNumber')}</Label>
              <Input
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="الرقم الضريبي"
                dir="ltr"
                className="font-mono"
              />
            </div>

            <div>
              <Label>{t('sales.commercialReg')}</Label>
              <Input
                value={commercialReg}
                onChange={(e) => setCommercialReg(e.target.value)}
                placeholder="رقم السجل التجاري"
                dir="ltr"
                className="font-mono"
              />
            </div>

            <div>
              <Label>شروط الدفع (أيام)</Label>
              <Input
                type="number"
                min="0"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                عدد أيام السماح للدفع
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>

            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supplier@example.com"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>العنوان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>المحافظة</Label>
              <Select value={governorate} onValueChange={setGovernorate}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="القاهرة">القاهرة</SelectItem>
                  <SelectItem value="الجيزة">الجيزة</SelectItem>
                  <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                  <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                  <SelectItem value="البحر الأحمر">البحر الأحمر</SelectItem>
                  <SelectItem value="البحيرة">البحيرة</SelectItem>
                  <SelectItem value="الفيوم">الفيوم</SelectItem>
                  <SelectItem value="الغربية">الغربية</SelectItem>
                  <SelectItem value="الإسماعيلية">الإسماعيلية</SelectItem>
                  <SelectItem value="المنوفية">المنوفية</SelectItem>
                  <SelectItem value="المنيا">المنيا</SelectItem>
                  <SelectItem value="القليوبية">القليوبية</SelectItem>
                  <SelectItem value="الشرقية">الشرقية</SelectItem>
                  <SelectItem value="السويس">السويس</SelectItem>
                  <SelectItem value="أسوان">أسوان</SelectItem>
                  <SelectItem value="أسيوط">أسيوط</SelectItem>
                  <SelectItem value="بني سويف">بني سويف</SelectItem>
                  <SelectItem value="بورسعيد">بورسعيد</SelectItem>
                  <SelectItem value="دمياط">دمياط</SelectItem>
                  <SelectItem value="سوهاج">سوهاج</SelectItem>
                  <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                  <SelectItem value="مطروح">مطروح</SelectItem>
                  <SelectItem value="الأقصر">الأقصر</SelectItem>
                  <SelectItem value="قنا">قنا</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>المدينة</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="المدينة"
              />
            </div>

            <div>
              <Label>العنوان التفصيلي</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="العنوان كاملاً..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية عن المورد..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
