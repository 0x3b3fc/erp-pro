'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  };
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
  lines: JournalEntryLine[];
  fiscalYear: {
    id: string;
    name: string;
  };
  createdByUser: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default function JournalEntriesPage() {
  const t = useTranslations();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Post dialog
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/accounts/journal-entries?${params}`);
      const data = await res.json();

      if (data.data) {
        setEntries(data.data.entries || []);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;

    try {
      const res = await fetch(`/api/v1/accounts/journal-entries/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchEntries();
      } else {
        const data = await res.json();
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const handlePost = async () => {
    if (!selectedEntry) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/v1/accounts/journal-entries/${selectedEntry.id}/post`,
        { method: 'POST' }
      );

      const data = await res.json();

      if (res.ok) {
        setShowPostDialog(false);
        setSelectedEntry(null);
        fetchEntries();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverse = async (id: string) => {
    if (!confirm('هل أنت متأكد من عكس هذا القيد؟')) return;

    try {
      const res = await fetch(`/api/v1/accounts/journal-entries/${id}/reverse`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        fetchEntries();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const openPostDialog = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowPostDialog(true);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">القيود اليومية</h1>
          <p className="text-muted-foreground">
            إدارة القيود المحاسبية اليومية
          </p>
        </div>
        <Button onClick={() => router.push('/accounts/journal-entries/new')}>
          <Plus className="h-4 w-4 me-2" />
          قيد جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم القيد أو الوصف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="DRAFT">مسودة</SelectItem>
            <SelectItem value="POSTED">مرحل</SelectItem>
            <SelectItem value="REVERSED">معكوس</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم القيد</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>المرجع</TableHead>
              <TableHead className="text-end">مدين</TableHead>
              <TableHead className="text-end">دائن</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {entry.entryNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(entry.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">{entry.description}</div>
                  </TableCell>
                  <TableCell>
                    {entry.reference || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-mono">
                    {formatCurrency(entry.totalDebit)}
                  </TableCell>
                  <TableCell className="text-end font-mono">
                    {formatCurrency(entry.totalCredit)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[entry.status] as any}>
                      {statusLabels[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/accounts/journal-entries/${entry.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 me-2" />
                          عرض
                        </DropdownMenuItem>

                        {entry.status === 'DRAFT' && (
                          <>
                            <DropdownMenuItem onClick={() => openPostDialog(entry)}>
                              <CheckCircle className="h-4 w-4 me-2" />
                              ترحيل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              حذف
                            </DropdownMenuItem>
                          </>
                        )}

                        {entry.status === 'POSTED' && (
                          <DropdownMenuItem onClick={() => handleReverse(entry.id)}>
                            <RotateCcw className="h-4 w-4 me-2" />
                            عكس القيد
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            عرض {entries.length} من {pagination.total} قيد
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Post Confirmation Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ترحيل القيد</DialogTitle>
            <DialogDescription>
              سيتم ترحيل القيد وتحديث أرصدة الحسابات. لا يمكن حذف القيد بعد الترحيل.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم القيد:</span>
                  <span className="font-medium">{selectedEntry.entryNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span>{formatDate(selectedEntry.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span className="font-mono">
                    {formatCurrency(selectedEntry.totalDebit)}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الحساب</TableHead>
                      <TableHead className="text-end">مدين</TableHead>
                      <TableHead className="text-end">دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <span className="font-mono text-sm me-2">
                            {line.account.code}
                          </span>
                          {line.account.nameAr}
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
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handlePost} disabled={submitting}>
              {submitting ? 'جاري الترحيل...' : 'تأكيد الترحيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
