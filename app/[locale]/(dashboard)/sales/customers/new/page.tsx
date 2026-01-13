'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === 'ar';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    customerType: 'BUSINESS',
    taxNumber: '',
    commercialRegister: '',
    nationalId: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    country: 'EG',
    creditLimit: 0,
    paymentTermsDays: 0,
    notes: '',
    isActive: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/sales/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t('common.success'));
        router.push(`/${locale}/sales/customers`);
      } else {
        toast.error(result.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <BackIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('common.create')} {t('sales.customer')}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales.customerName')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('sales.customerCode')} *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="C001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerType">{t('common.status')}</Label>
                  <select
                    id="customerType"
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="BUSINESS">شركة / Business</option>
                    <option value="INDIVIDUAL">فرد / Individual</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">{t('auth.nameAr')} *</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleChange}
                  required
                  placeholder="اسم العميل بالعربية"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">{t('auth.nameEn')} *</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  value={formData.nameEn}
                  onChange={handleChange}
                  required
                  placeholder="Customer name in English"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Legal */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales.taxNumber')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxNumber">{t('sales.taxNumber')}</Label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder="100-000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commercialRegister">{t('sales.commercialReg')}</Label>
                <Input
                  id="commercialRegister"
                  name="commercialRegister"
                  value={formData.commercialRegister}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">{t('sales.nationalId')}</Label>
                <Input
                  id="nationalId"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.phone')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">موبايل / Mobile</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('settings.address')}</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">المدينة / City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales.creditLimit')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit">{t('sales.creditLimit')}</Label>
                <Input
                  id="creditLimit"
                  name="creditLimit"
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTermsDays">{t('sales.paymentTerms')} (أيام)</Label>
                <Input
                  id="paymentTermsDays"
                  name="paymentTermsDays"
                  type="number"
                  min="0"
                  value={formData.paymentTermsDays}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('sales.notes')}</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">نشط / Active</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
