'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">سجل النشاطات</h1>
        <p className="text-slate-400">سجل جميع الأنشطة في النظام</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            النشاطات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Clock className="h-12 w-12 mb-4" />
            <p>سجل النشاطات قيد التطوير</p>
            <p className="text-sm mt-2">سيتم إضافة سجل شامل لجميع الأنشطة قريباً</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
