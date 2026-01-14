'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Building2,
    Globe,
    Bell,
    FileText,
    Users,
    Shield,
    CreditCard,
    Palette,
    Database,
    Mail,
    MessageSquare,
    Key,
    Save,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type SettingsTab = 'company' | 'localization' | 'eta' | 'notifications' | 'users' | 'integrations' | 'billing' | 'security';

interface CompanySettings {
    nameAr: string;
    nameEn: string;
    taxNumber: string;
    commercialReg: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
}

interface ETASettings {
    clientId: string;
    clientSecret: string;
    environment: 'preprod' | 'production';
    isConnected: boolean;
    lastSync: string | null;
}

interface NotificationSettings {
    emailNotifications: boolean;
    lowStockAlerts: boolean;
    paymentReminders: boolean;
    invoiceDueAlerts: boolean;
    budgetAlerts: boolean;
    whatsappEnabled: boolean;
}

export default function SettingsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Company settings state
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        nameAr: '',
        nameEn: '',
        taxNumber: '',
        commercialReg: '',
        address: '',
        city: '',
        country: 'مصر',
        phone: '',
        email: '',
        website: '',
        logo: '',
    });

    // ETA settings state
    const [etaSettings, setETASettings] = useState<ETASettings>({
        clientId: '',
        clientSecret: '',
        environment: 'preprod',
        isConnected: false,
        lastSync: null,
    });

    // Notification settings state
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        emailNotifications: true,
        lowStockAlerts: true,
        paymentReminders: true,
        invoiceDueAlerts: true,
        budgetAlerts: false,
        whatsappEnabled: false,
    });

    // Fetch company settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/v1/settings/company');
                const result = await res.json();

                if (result.data) {
                    const data = result.data;
                    setCompanySettings({
                        nameAr: data.nameAr || '',
                        nameEn: data.nameEn || '',
                        taxNumber: data.taxNumber || '',
                        commercialReg: data.commercialRegNumber || '',
                        address: data.address || '',
                        city: data.city || '',
                        country: data.governorate || 'مصر',
                        phone: data.phone || '',
                        email: data.email || '',
                        website: data.website || '',
                        logo: data.logo || '',
                    });
                    setETASettings({
                        clientId: data.etaClientId || '',
                        clientSecret: data.etaClientSecret || '',
                        environment: data.etaEnvironment === 'PRODUCTION' ? 'production' : 'preprod',
                        isConnected: data.hasEtaCredentials || false,
                        lastSync: null,
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                setErrorMessage(locale === 'ar' ? 'خطأ في جلب البيانات' : 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [locale]);

    const tabs = [
        { id: 'company' as SettingsTab, label: locale === 'ar' ? 'بيانات الشركة' : 'Company Info', icon: Building2 },
        { id: 'localization' as SettingsTab, label: locale === 'ar' ? 'اللغة والعملة' : 'Localization', icon: Globe },
        { id: 'eta' as SettingsTab, label: locale === 'ar' ? 'الفاتورة الإلكترونية' : 'E-Invoice (ETA)', icon: FileText },
        { id: 'notifications' as SettingsTab, label: locale === 'ar' ? 'الإشعارات' : 'Notifications', icon: Bell },
        { id: 'users' as SettingsTab, label: locale === 'ar' ? 'المستخدمين' : 'Users', icon: Users },
        { id: 'integrations' as SettingsTab, label: locale === 'ar' ? 'التكاملات' : 'Integrations', icon: MessageSquare },
        { id: 'billing' as SettingsTab, label: locale === 'ar' ? 'الاشتراك والفواتير' : 'Billing', icon: CreditCard },
        { id: 'security' as SettingsTab, label: locale === 'ar' ? 'الأمان' : 'Security', icon: Shield },
    ];

    const handleSave = async () => {
        setSaving(true);
        setErrorMessage(null);
        try {
            const res = await fetch('/api/v1/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nameAr: companySettings.nameAr,
                    nameEn: companySettings.nameEn,
                    taxNumber: companySettings.taxNumber,
                    commercialRegNumber: companySettings.commercialReg,
                    address: companySettings.address,
                    governorate: companySettings.country,
                    city: companySettings.city,
                    phone: companySettings.phone,
                    email: companySettings.email,
                    website: companySettings.website,
                    logo: companySettings.logo,
                    etaClientId: etaSettings.clientId,
                    etaClientSecret: etaSettings.clientSecret,
                    etaEnvironment: etaSettings.environment === 'production' ? 'PRODUCTION' : 'PREPROD',
                }),
            });

            const result = await res.json();

            if (res.ok) {
                setSuccessMessage(locale === 'ar' ? 'تم الحفظ بنجاح' : 'Settings saved successfully');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setErrorMessage(result.error || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setErrorMessage(locale === 'ar' ? 'خطأ في حفظ البيانات' : 'Error saving data');
        } finally {
            setSaving(false);
        }
    };

    const renderCompanySettings = () => (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="nameAr">{locale === 'ar' ? 'اسم الشركة بالعربية' : 'Company Name (Arabic)'}</Label>
                    <Input
                        id="nameAr"
                        value={companySettings.nameAr}
                        onChange={(e) => setCompanySettings({ ...companySettings, nameAr: e.target.value })}
                        placeholder={locale === 'ar' ? 'شركة المثال للتجارة' : 'Example Trading Co.'}
                        dir="rtl"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nameEn">{locale === 'ar' ? 'اسم الشركة بالإنجليزية' : 'Company Name (English)'}</Label>
                    <Input
                        id="nameEn"
                        value={companySettings.nameEn}
                        onChange={(e) => setCompanySettings({ ...companySettings, nameEn: e.target.value })}
                        placeholder="Example Trading Co."
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="taxNumber">{locale === 'ar' ? 'الرقم الضريبي' : 'Tax Registration Number'}</Label>
                    <Input
                        id="taxNumber"
                        value={companySettings.taxNumber}
                        onChange={(e) => setCompanySettings({ ...companySettings, taxNumber: e.target.value })}
                        placeholder="123-456-789"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="commercialReg">{locale === 'ar' ? 'السجل التجاري' : 'Commercial Registration'}</Label>
                    <Input
                        id="commercialReg"
                        value={companySettings.commercialReg}
                        onChange={(e) => setCompanySettings({ ...companySettings, commercialReg: e.target.value })}
                        placeholder="12345"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">{locale === 'ar' ? 'العنوان' : 'Address'}</Label>
                <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    placeholder={locale === 'ar' ? '123 شارع التحرير، وسط البلد' : '123 Tahrir St., Downtown'}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="city">{locale === 'ar' ? 'المدينة' : 'City'}</Label>
                    <Input
                        id="city"
                        value={companySettings.city}
                        onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                        placeholder={locale === 'ar' ? 'القاهرة' : 'Cairo'}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">{locale === 'ar' ? 'الدولة' : 'Country'}</Label>
                    <Input
                        id="country"
                        value={companySettings.country}
                        onChange={(e) => setCompanySettings({ ...companySettings, country: e.target.value })}
                        placeholder={locale === 'ar' ? 'مصر' : 'Egypt'}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="phone">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                    <Input
                        id="phone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                        placeholder="+20 2 1234 5678"
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                        placeholder="info@company.com"
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="website">{locale === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</Label>
                <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    placeholder="https://www.company.com"
                    dir="ltr"
                />
            </div>

            <div className="space-y-2">
                <Label>{locale === 'ar' ? 'شعار الشركة' : 'Company Logo'}</Label>
                <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                        <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <Button variant="outline">{locale === 'ar' ? 'رفع صورة' : 'Upload Image'}</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'PNG أو JPG، حجم أقصى 2MB' : 'PNG or JPG, max 2MB'}
                </p>
            </div>
        </div>
    );

    const renderLocalizationSettings = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'إعدادات اللغة' : 'Language Settings'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'العربية (مصر)' : 'Arabic (Egypt)'}</p>
                        </div>
                        <Badge variant="secondary">{locale === 'ar' ? 'العربية' : 'Arabic'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'اللغات المتاحة' : 'Available Languages'}</Label>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'العربية والإنجليزية' : 'Arabic & English'}</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge>AR</Badge>
                            <Badge variant="outline">EN</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'إعدادات العملة' : 'Currency Settings'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'العملة الرئيسية' : 'Primary Currency'}</Label>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'جنيه مصري (EGP)' : 'Egyptian Pound (EGP)'}</p>
                        </div>
                        <Badge variant="secondary">EGP</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'عرض رمز العملة' : 'Currency Symbol Display'}</Label>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'ج.م بعد المبلغ' : 'EGP after amount'}</p>
                        </div>
                        <span className="text-sm font-medium">1,234.56 ج.م</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'إعدادات التاريخ' : 'Date Settings'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'تنسيق التاريخ' : 'Date Format'}</Label>
                            <p className="text-sm text-muted-foreground">DD/MM/YYYY</p>
                        </div>
                        <span className="text-sm font-medium">14/01/2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'السنة المالية' : 'Fiscal Year'}</Label>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'يناير - ديسمبر' : 'January - December'}</p>
                        </div>
                        <Badge variant="outline">{locale === 'ar' ? 'تقويم ميلادي' : 'Gregorian'}</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderETASettings = () => (
        <div className="space-y-6">
            <Card className={etaSettings.isConnected ? 'border-green-500/50' : 'border-orange-500/50'}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            {etaSettings.isConnected ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                            )}
                            {locale === 'ar' ? 'حالة الاتصال بـ ETA' : 'ETA Connection Status'}
                        </CardTitle>
                        <Badge variant={etaSettings.isConnected ? 'default' : 'secondary'}>
                            {etaSettings.isConnected
                                ? (locale === 'ar' ? 'متصل' : 'Connected')
                                : (locale === 'ar' ? 'غير متصل' : 'Not Connected')
                            }
                        </Badge>
                    </div>
                    <CardDescription>
                        {locale === 'ar'
                            ? 'إعداد الاتصال بمنظومة الفاتورة الإلكترونية المصرية'
                            : 'Configure connection to Egyptian Tax Authority e-Invoice system'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="etaClientId">{locale === 'ar' ? 'معرف العميل (Client ID)' : 'Client ID'}</Label>
                            <Input
                                id="etaClientId"
                                type="password"
                                value={etaSettings.clientId}
                                onChange={(e) => setETASettings({ ...etaSettings, clientId: e.target.value })}
                                placeholder="••••••••••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="etaClientSecret">{locale === 'ar' ? 'المفتاح السري (Client Secret)' : 'Client Secret'}</Label>
                            <Input
                                id="etaClientSecret"
                                type="password"
                                value={etaSettings.clientSecret}
                                onChange={(e) => setETASettings({ ...etaSettings, clientSecret: e.target.value })}
                                placeholder="••••••••••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'البيئة' : 'Environment'}</Label>
                        <div className="flex gap-4">
                            <Button
                                variant={etaSettings.environment === 'preprod' ? 'default' : 'outline'}
                                onClick={() => setETASettings({ ...etaSettings, environment: 'preprod' })}
                                className="flex-1"
                            >
                                {locale === 'ar' ? 'اختبار (Preprod)' : 'Testing (Preprod)'}
                            </Button>
                            <Button
                                variant={etaSettings.environment === 'production' ? 'default' : 'outline'}
                                onClick={() => setETASettings({ ...etaSettings, environment: 'production' })}
                                className="flex-1"
                            >
                                {locale === 'ar' ? 'إنتاج (Production)' : 'Production'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1">
                            <RefreshCw className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'إعدادات الإرسال' : 'Submission Settings'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'الإرسال التلقائي' : 'Auto Submit'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'إرسال الفواتير تلقائياً عند الترحيل' : 'Automatically submit invoices when posted'}
                            </p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'إعادة المحاولة التلقائية' : 'Auto Retry'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'إعادة محاولة الإرسال تلقائياً عند الفشل' : 'Automatically retry failed submissions'}
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'تلقي إشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'تنبيه المخزون المنخفض' : 'Low Stock Alert'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'تنبيه عند وصول المخزون لنقطة إعادة الطلب' : 'Alert when stock reaches reorder point'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.lowStockAlerts}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowStockAlerts: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'تنبيهات المالية' : 'Financial Alerts'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'تذكير بالدفعات' : 'Payment Reminders'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'إرسال تذكيرات للعملاء بالدفعات المستحقة' : 'Send reminders to customers for due payments'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.paymentReminders}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, paymentReminders: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'تنبيه استحقاق الفواتير' : 'Invoice Due Alerts'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'تنبيه قبل استحقاق الفواتير' : 'Alert before invoice due date'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.invoiceDueAlerts}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, invoiceDueAlerts: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'تنبيه تجاوز الميزانية' : 'Budget Overrun Alerts'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'تنبيه عند تجاوز الميزانية المحددة' : 'Alert when budget is exceeded'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.budgetAlerts}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, budgetAlerts: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'واتساب' : 'WhatsApp'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{locale === 'ar' ? 'إشعارات واتساب' : 'WhatsApp Notifications'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'إرسال الفواتير والتنبيهات عبر واتساب' : 'Send invoices and alerts via WhatsApp'}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSettings.whatsappEnabled}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, whatsappEnabled: checked })}
                        />
                    </div>
                    {notificationSettings.whatsappEnabled && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar'
                                    ? 'يتطلب إعداد Twilio API في قسم التكاملات'
                                    : 'Requires Twilio API setup in Integrations section'
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderUsersSettings = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h3>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'إدارة المستخدمين وصلاحياتهم' : 'Manage users and their permissions'}
                    </p>
                </div>
                <Button>
                    <Users className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {[
                            { name: 'أحمد محمد', email: 'ahmed@company.com', role: 'admin', status: 'active' },
                            { name: 'سارة علي', email: 'sara@company.com', role: 'accountant', status: 'active' },
                            { name: 'محمد إبراهيم', email: 'mohamed@company.com', role: 'sales', status: 'active' },
                        ].map((user, index) => (
                            <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-medium text-primary">{user.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                        {user.role === 'admin' && (locale === 'ar' ? 'مدير' : 'Admin')}
                                        {user.role === 'accountant' && (locale === 'ar' ? 'محاسب' : 'Accountant')}
                                        {user.role === 'sales' && (locale === 'ar' ? 'مبيعات' : 'Sales')}
                                    </Badge>
                                    <Button variant="ghost" size="sm">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { role: 'admin', label: locale === 'ar' ? 'مدير' : 'Admin', desc: locale === 'ar' ? 'صلاحيات كاملة' : 'Full access' },
                            { role: 'accountant', label: locale === 'ar' ? 'محاسب' : 'Accountant', desc: locale === 'ar' ? 'المالية والتقارير' : 'Finance & Reports' },
                            { role: 'sales', label: locale === 'ar' ? 'مبيعات' : 'Sales', desc: locale === 'ar' ? 'المبيعات والعملاء' : 'Sales & Customers' },
                            { role: 'viewer', label: locale === 'ar' ? 'مشاهد' : 'Viewer', desc: locale === 'ar' ? 'عرض فقط' : 'View only' },
                        ].map((item) => (
                            <div key={item.role} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                    {locale === 'ar' ? 'تعديل' : 'Edit'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderIntegrationsSettings = () => (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {[
                    {
                        name: 'WhatsApp Business',
                        desc: locale === 'ar' ? 'إرسال الفواتير والتنبيهات' : 'Send invoices & alerts',
                        icon: MessageSquare,
                        status: 'not_connected'
                    },
                    {
                        name: 'Paymob',
                        desc: locale === 'ar' ? 'قبول المدفوعات الإلكترونية' : 'Accept online payments',
                        icon: CreditCard,
                        status: 'not_connected'
                    },
                    {
                        name: 'Fawry',
                        desc: locale === 'ar' ? 'الدفع عبر فوري' : 'Fawry payments',
                        icon: CreditCard,
                        status: 'not_connected'
                    },
                    {
                        name: 'SMS Gateway',
                        desc: locale === 'ar' ? 'إرسال رسائل SMS' : 'Send SMS messages',
                        icon: Mail,
                        status: 'not_connected'
                    },
                    {
                        name: 'Google Sheets',
                        desc: locale === 'ar' ? 'تصدير البيانات تلقائياً' : 'Auto export data',
                        icon: Database,
                        status: 'not_connected'
                    },
                    {
                        name: 'Zapier',
                        desc: locale === 'ar' ? 'ربط مع آلاف التطبيقات' : 'Connect to 1000s of apps',
                        icon: Key,
                        status: 'not_connected'
                    },
                ].map((integration) => (
                    <Card key={integration.name}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <integration.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{integration.name}</h4>
                                        <p className="text-sm text-muted-foreground">{integration.desc}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button variant="outline" className="w-full">
                                    {locale === 'ar' ? 'ربط' : 'Connect'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'API والتكامل المخصص' : 'API & Custom Integration'}</CardTitle>
                    <CardDescription>
                        {locale === 'ar'
                            ? 'استخدم API لربط النظام مع أي تطبيق آخر'
                            : 'Use API to integrate with any other application'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'مفتاح API' : 'API Key'}</Label>
                        <div className="flex gap-2">
                            <Input type="password" value="sk_live_xxxxxxxxxxxxxxxxxxxxx" readOnly className="font-mono" />
                            <Button variant="outline">{locale === 'ar' ? 'نسخ' : 'Copy'}</Button>
                        </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">{locale === 'ar' ? 'توثيق API' : 'API Documentation'}</p>
                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar'
                                ? 'اطلع على توثيق API الكامل لمعرفة كيفية التكامل'
                                : 'Check out our full API documentation for integration guide'
                            }
                        </p>
                        <Button variant="link" className="p-0 h-auto mt-2">
                            {locale === 'ar' ? 'عرض التوثيق' : 'View Documentation'} →
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderBillingSettings = () => (
        <div className="space-y-6">
            <Card className="border-primary/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">{locale === 'ar' ? 'الباقة الحالية' : 'Current Plan'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'باقة الأعمال' : 'Business Plan'}
                            </CardDescription>
                        </div>
                        <Badge className="text-lg px-4 py-1">{locale === 'ar' ? '500 ج.م/شهر' : '500 EGP/mo'}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">5</p>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'مستخدمين' : 'Users'}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">∞</p>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'فواتير' : 'Invoices'}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">10 GB</p>
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'تخزين' : 'Storage'}</p>
                        </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                        {locale === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-muted-foreground">Visa - {locale === 'ar' ? 'ينتهي' : 'Expires'} 12/2027</p>
                            </div>
                        </div>
                        <Badge variant="secondary">{locale === 'ar' ? 'افتراضي' : 'Default'}</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                        {locale === 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'سجل الفواتير' : 'Invoice History'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {[
                            { date: '01/01/2026', amount: '500 ج.م', status: 'paid' },
                            { date: '01/12/2025', amount: '500 ج.م', status: 'paid' },
                            { date: '01/11/2025', amount: '500 ج.م', status: 'paid' },
                        ].map((invoice, index) => (
                            <div key={index} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium">{invoice.date}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{locale === 'ar' ? 'مدفوعة' : 'Paid'}</Badge>
                                    <Button variant="ghost" size="sm">
                                        {locale === 'ar' ? 'تحميل' : 'Download'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                        <Input type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                        <Input type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                        <Input type="password" />
                    </div>
                    <Button>{locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</CardTitle>
                    <CardDescription>
                        {locale === 'ar'
                            ? 'أضف طبقة حماية إضافية لحسابك'
                            : 'Add an extra layer of security to your account'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{locale === 'ar' ? 'تفعيل المصادقة الثنائية' : 'Enable 2FA'}</p>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'استخدم تطبيق Authenticator' : 'Use Authenticator app'}
                            </p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{locale === 'ar' ? 'سجل النشاط' : 'Activity Log'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {[
                            { action: locale === 'ar' ? 'تسجيل دخول' : 'Login', device: 'Chrome / macOS', time: locale === 'ar' ? 'منذ ساعة' : '1 hour ago' },
                            { action: locale === 'ar' ? 'تعديل الإعدادات' : 'Settings changed', device: 'Chrome / macOS', time: locale === 'ar' ? 'منذ 3 ساعات' : '3 hours ago' },
                            { action: locale === 'ar' ? 'تسجيل دخول' : 'Login', device: 'Safari / iPhone', time: locale === 'ar' ? 'أمس' : 'Yesterday' },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium">{activity.action}</p>
                                    <p className="text-sm text-muted-foreground">{activity.device}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">{activity.time}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-lg text-destructive">{locale === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}</p>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'حذف الحساب وجميع البيانات نهائياً' : 'Permanently delete account and all data'}
                            </p>
                        </div>
                        <Button variant="destructive">
                            {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'company':
                return renderCompanySettings();
            case 'localization':
                return renderLocalizationSettings();
            case 'eta':
                return renderETASettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'users':
                return renderUsersSettings();
            case 'integrations':
                return renderIntegrationsSettings();
            case 'billing':
                return renderBillingSettings();
            case 'security':
                return renderSecuritySettings();
            default:
                return renderCompanySettings();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{locale === 'ar' ? 'الإعدادات' : 'Settings'}</h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar' ? 'إدارة إعدادات الشركة والنظام' : 'Manage company and system settings'}
                    </p>
                </div>
                {successMessage && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{successMessage}</span>
                    </div>
                )}
                {errorMessage && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorMessage}</span>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
                {/* Sidebar */}
                <Card className="h-fit">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>

                {/* Content */}
                <Card>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {renderContent()}

                                {/* Save Button (for some tabs) */}
                                {['company', 'eta', 'notifications'].includes(activeTab) && (
                                    <div className="flex justify-end mt-6 pt-6 border-t">
                                        <Button onClick={handleSave} disabled={saving}>
                                            {saving ? (
                                                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 me-2" />
                                            )}
                                            {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
