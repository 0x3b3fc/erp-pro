'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  FileText,
  Calendar,
  User,
  CheckCircle,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface JournalEntryLine {
  id: string;
  lineNumber: number;
  debit: string;
  credit: string;
  description: string | null;
  account: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    accountType: string;
  };
  costCenter: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  } | null;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string | null;
  description: string;
  totalDebit: string;
  totalCredit: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  sourceType: string | null;
  sourceId: string | null;
  postedAt: string | null;
  createdAt: string;
  isReversing: boolean;
  reversesEntryId: string | null;
  lines: JournalEntryLine[];
  fiscalYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  createdByUser: {
    id: string;
    nameAr: string;
    nameEn: string;
    email: string;
  } | null;
  postedByUser: {
    id: string;
    nameAr: string;
    nameEn: string;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  POSTED: 'default',
  REVERSED: 'destructive',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  POSTED: 'مرحل',
  REVERSED: 'معكوس',
};

export default function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations();
  const router = useRouter();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/accounts/journal-entries/${id}`);
      const data = await res.json();

      if (data.data) {
        setEntry(data.data);
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const handlePost = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/accounts/journal-entries/${id}/post`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setShowPostDialog(false);
        fetchEntry();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverse = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/accounts/journal-entries/${id}/reverse`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setShowReverseDialog(false);
        fetchEntry();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground">القيد غير موجود</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">قيد يومية #{entry.entryNumber}</h1>
            <p className="text-muted-foreground">{entry.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />
            طباعة
          </Button>

          {entry.status === 'DRAFT' && (
            <Button onClick={() => setShowPostDialog(true)}>
              <CheckCircle className="h-4 w-4 me-2" />
              ترحيل
            </Button>
          )}

          {entry.status === 'POSTED' && (
            <Button variant="destructive" onClick={() => setShowReverseDialog(true)}>
              <RotateCcw className="h-4 w-4 me-2" />
              عكس القيد
            </Button>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">قيد يومية</h1>
        <p className="text-lg">رقم {entry.entryNumber}</p>
      </div>

      {/* Entry Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-sm">رقم القيد</span>
          </div>
          <div className="font-semibold">{entry.entryNumber}</div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">التاريخ</span>
          </div>
          <div className="font-semibold">{formatDate(entry.date)}</div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">الحالة</div>
          <Badge variant={statusColors[entry.status] as any} className="text-sm">
            {statusLabels[entry.status]}
          </Badge>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">السنة المالية</div>
          <div className="font-semibold">{entry.fiscalYear.name}</div>
        </div>
      </div>

      {/* Reference & Description */}
      <div className="border rounded-lg p-4 space-y-3">
        {entry.reference && (
          <div>
            <span className="text-muted-foreground">المرجع: </span>
            <span className="font-medium">{entry.reference}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">الوصف: </span>
          <span className="font-medium">{entry.description}</span>
        </div>
        {entry.isReversing && (
          <Badge variant="outline">قيد عكسي</Badge>
        )}
      </div>

      {/* Entry Lines */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead className="w-[100px]">كود الحساب</TableHead>
              <TableHead>اسم الحساب</TableHead>
              <TableHead>البيان</TableHead>
              <TableHead className="text-end w-[150px]">مدين</TableHead>
              <TableHead className="text-end w-[150px]">دائن</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-muted-foreground">
                  {line.lineNumber}
                </TableCell>
                <TableCell className="font-mono">{line.account.code}</TableCell>
                <TableCell>
                  <div>{line.account.nameAr}</div>
                  {line.costCenter && (
                    <div className="text-xs text-muted-foreground">
                      مركز التكلفة: {line.costCenter.nameAr}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {line.description || '-'}
                </TableCell>
                <TableCell className="text-end font-mono">
                  {Number(line.debit) > 0 ? formatCurrency(line.debit) : '-'}
                </TableCell>
                <TableCell className="text-end font-mono">
                  {Number(line.credit) > 0 ? formatCurrency(line.credit) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">
                الإجمالي
              </TableCell>
              <TableCell className="text-end font-mono font-semibold">
                {formatCurrency(entry.totalDebit)}
              </TableCell>
              <TableCell className="text-end font-mono font-semibold">
                {formatCurrency(entry.totalCredit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Audit Info */}
      <div className="border rounded-lg p-4 space-y-3 text-sm print:hidden">
        <h3 className="font-semibold">معلومات التدقيق</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground">أنشئ بواسطة: </span>
            <span>{entry.createdByUser?.nameAr || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">تاريخ الإنشاء: </span>
            <span>{formatDateTime(entry.createdAt)}</span>
          </div>
          {entry.postedAt && (
            <>
              <div>
                <span className="text-muted-foreground">رحل بواسطة: </span>
                <span>{entry.postedByUser?.nameAr || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">تاريخ الترحيل: </span>
                <span>{formatDateTime(entry.postedAt)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Confirmation Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ترحيل القيد</DialogTitle>
            <DialogDescription>
              سيتم ترحيل القيد وتحديث أرصدة الحسابات. لا يمكن حذف القيد بعد
              الترحيل.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">رقم القيد:</span>
              <span className="font-medium">{entry.entryNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="font-mono">{formatCurrency(entry.totalDebit)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePost} disabled={submitting}>
              {submitting ? 'جاري الترحيل...' : 'تأكيد الترحيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse Confirmation Dialog */}
      <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>عكس القيد</DialogTitle>
            <DialogDescription>
              سيتم إنشاء قيد عكسي جديد لإلغاء تأثير هذا القيد على أرصدة الحسابات.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">رقم القيد:</span>
              <span className="font-medium">{entry.entryNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="font-mono">{formatCurrency(entry.totalDebit)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverseDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReverse}
              disabled={submitting}
            >
              {submitting ? 'جاري العكس...' : 'تأكيد العكس'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
