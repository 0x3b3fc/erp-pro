'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">التقارير</h1>
        <p className="text-slate-400">تقارير النظام والإحصائيات</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تقرير الشركات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">عرض تقرير شامل عن جميع الشركات المسجلة</p>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300">
              <Download className="h-4 w-4 me-2" />
              تصدير Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              تقرير الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">تحليل الإيرادات والاشتراكات</p>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300">
              <Download className="h-4 w-4 me-2" />
              تصدير Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              تقرير المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">إجمالي المبيعات من جميع الشركات</p>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300">
              <Download className="h-4 w-4 me-2" />
              تصدير Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">ملاحظة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            التقارير التفصيلية قيد التطوير. سيتم إضافة تقارير قابلة للتصدير قريباً.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
