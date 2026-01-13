'use client';

import { useState, useEffect } from 'react';
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

interface Category {
  id: string;
  nameAr: string;
  nameEn: string | null;
}

export default function NewProductPage() {
  const t = useTranslations();
  const router = useRouter();

  // Form state
  const [sku, setSku] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('EA');
  const [salePrice, setSalePrice] = useState('0');
  const [costPrice, setCostPrice] = useState('');
  const [vatRate, setVatRate] = useState('14');
  const [etaCode, setEtaCode] = useState('');
  const [etaUnitType, setEtaUnitType] = useState('EA');
  const [barcode, setBarcode] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/v1/inventory/categories?limit=100');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Save product
  const handleSave = async () => {
    if (!sku.trim()) {
      alert('كود المنتج مطلوب');
      return;
    }
    if (!nameAr.trim()) {
      alert('اسم المنتج بالعربية مطلوب');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          unitOfMeasure,
          salePrice: parseFloat(salePrice) || 0,
          costPrice: costPrice ? parseFloat(costPrice) : undefined,
          vatRate: parseFloat(vatRate) || 14,
          etaCode: etaCode.trim() || undefined,
          etaUnitType: etaUnitType || undefined,
          barcode: barcode.trim() || undefined,
          reorderPoint: reorderPoint ? parseInt(reorderPoint) : undefined,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/inventory/products');
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
            <h1 className="text-2xl font-bold">منتج جديد</h1>
            <p className="text-muted-foreground">إضافة منتج جديد للمخزون</p>
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
              <Label>{t('inventory.sku')} *</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PRD-001"
                className="font-mono"
              />
            </div>

            <div>
              <Label>الاسم بالعربية *</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم المنتج"
              />
            </div>

            <div>
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Product Name"
                dir="ltr"
              />
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف المنتج..."
                rows={3}
              />
            </div>

            <div>
              <Label>{t('inventory.category')}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>الأسعار والوحدات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('inventory.unitOfMeasure')}</Label>
              <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EA">قطعة (EA)</SelectItem>
                  <SelectItem value="KGM">كيلوجرام (KGM)</SelectItem>
                  <SelectItem value="MTR">متر (MTR)</SelectItem>
                  <SelectItem value="LTR">لتر (LTR)</SelectItem>
                  <SelectItem value="MTK">متر مربع (MTK)</SelectItem>
                  <SelectItem value="MTQ">متر مكعب (MTQ)</SelectItem>
                  <SelectItem value="PR">زوج (PR)</SelectItem>
                  <SelectItem value="BX">صندوق (BX)</SelectItem>
                  <SelectItem value="DZ">دستة (DZ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('inventory.salesPrice')} *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                dir="ltr"
              />
            </div>

            <div>
              <Label>{t('inventory.costPrice')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                dir="ltr"
                placeholder="اختياري"
              />
            </div>

            <div>
              <Label>{t('common.vat')} %</Label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14% (نسبة عادية)</SelectItem>
                  <SelectItem value="0">0% (معفي/صادرات)</SelectItem>
                  <SelectItem value="5">5% (نسبة مخفضة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('inventory.barcode')}</Label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="6221234567890"
                dir="ltr"
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* ETA Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الفاتورة الإلكترونية (ETA)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>كود GS1/EGS</Label>
              <Input
                value={etaCode}
                onChange={(e) => setEtaCode(e.target.value)}
                placeholder="EG-123456789-12345"
                dir="ltr"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground mt-1">
                كود المنتج في منظومة الفاتورة الإلكترونية
              </p>
            </div>

            <div>
              <Label>وحدة القياس ETA</Label>
              <Select value={etaUnitType} onValueChange={setEtaUnitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EA">EA - قطعة</SelectItem>
                  <SelectItem value="KGM">KGM - كيلوجرام</SelectItem>
                  <SelectItem value="MTR">MTR - متر</SelectItem>
                  <SelectItem value="LTR">LTR - لتر</SelectItem>
                  <SelectItem value="MTK">MTK - متر مربع</SelectItem>
                  <SelectItem value="MTQ">MTQ - متر مكعب</SelectItem>
                  <SelectItem value="TNE">TNE - طن</SelectItem>
                  <SelectItem value="PR">PR - زوج</SelectItem>
                  <SelectItem value="SET">SET - طقم</SelectItem>
                  <SelectItem value="HR">HR - ساعة</SelectItem>
                  <SelectItem value="DAY">DAY - يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات المخزون</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('inventory.reorderPoint')}</Label>
              <Input
                type="number"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                placeholder="الحد الأدنى للتنبيه"
              />
              <p className="text-sm text-muted-foreground mt-1">
                سيتم التنبيه عند وصول المخزون لهذا الحد
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>حالة المنتج</Label>
                <p className="text-sm text-muted-foreground">
                  المنتج النشط يظهر في الفواتير ونقاط البيع
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
