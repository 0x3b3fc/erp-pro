'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { register } from '@/lib/auth/actions';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building2, Phone } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nameAr: '',
    nameEn: '',
    companyNameAr: '',
    companyNameEn: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Validate step 1
      if (formData.password !== formData.confirmPassword) {
        setError(t('passwordMismatch'));
        return;
      }
      if (formData.password.length < 8) {
        setError(t('passwordTooShort'));
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        companyNameAr: formData.companyNameAr,
        companyNameEn: formData.companyNameEn,
        phone: formData.phone,
      });

      if (result.success) {
        router.push(`/${locale}/login?registered=true`);
      } else {
        setError(result.error || t('registerFailed'));
      }
    } catch {
      setError(t('registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('register')}</CardTitle>
        <CardDescription>{t('registerDescription')}</CardDescription>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Step 1: Account Information */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="ps-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="ps-10 pe-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="ps-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Personal & Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t('nameAr')}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nameAr"
                      name="nameAr"
                      type="text"
                      placeholder="الاسم بالعربية"
                      value={formData.nameAr}
                      onChange={handleChange}
                      className="ps-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t('nameEn')}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nameEn"
                      name="nameEn"
                      type="text"
                      placeholder="Name in English"
                      value={formData.nameEn}
                      onChange={handleChange}
                      className="ps-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyNameAr">{t('companyNameAr')}</Label>
                  <div className="relative">
                    <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyNameAr"
                      name="companyNameAr"
                      type="text"
                      placeholder="اسم الشركة بالعربية"
                      value={formData.companyNameAr}
                      onChange={handleChange}
                      className="ps-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNameEn">{t('companyNameEn')}</Label>
                  <div className="relative">
                    <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyNameEn"
                      name="companyNameEn"
                      type="text"
                      placeholder="Company name in English"
                      value={formData.companyNameEn}
                      onChange={handleChange}
                      className="ps-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    className="ps-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex gap-2 w-full">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                {t('back')}
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('registering')}
                </>
              ) : step === 1 ? (
                t('next')
              ) : (
                t('register')
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t('haveAccount')}{' '}
            <Link
              href={`/${locale}/login`}
              className="text-primary hover:underline font-medium"
            >
              {t('login')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
