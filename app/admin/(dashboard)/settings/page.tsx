'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [systemName, setSystemName] = useState('نظام ERP المصري');
  const [systemEmail, setSystemEmail] = useState('support@erp.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Implement settings save
    setTimeout(() => {
      toast.success('تم حفظ الإعدادات بنجاح');
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
          <p className="text-slate-400">إعدادات النظام العامة</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات عامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">اسم النظام</Label>
              <Input
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">البريد الإلكتروني للنظام</Label>
              <Input
                type="email"
                value={systemEmail}
                onChange={(e) => setSystemEmail(e.target.value)}
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">إعدادات النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">وضع الصيانة</Label>
                <p className="text-sm text-slate-400">إيقاف النظام للصيانة</p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">السماح بالتسجيلات</Label>
                <p className="text-sm text-slate-400">السماح بإنشاء حسابات جديدة</p>
              </div>
              <Switch
                checked={allowRegistrations}
                onCheckedChange={setAllowRegistrations}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
