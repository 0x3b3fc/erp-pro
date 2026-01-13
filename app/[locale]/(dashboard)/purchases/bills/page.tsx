'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, FileText, Eye, Trash2, MoreHorizontal, CheckCircle, Receipt } from 'lucide-react';
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

interface PurchaseBill {
  id: string;
  billNumber: string;
  date: string;
  dueDate: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  paidAmount: string;
  status: string;
  journalEntryId: string | null;
  supplier: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  };
  purchaseOrder: {
    id: string;
    poNumber: string;
  } | null;
  _count: {
    lines: number;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'default',
  APPROVED: 'default',
  PARTIALLY_PAID: 'secondary',
  PAID: 'default',
  OVERDUE: 'destructive',
  CANCELLED: 'destructive',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING_APPROVAL: 'في انتظار الموافقة',
  APPROVED: 'موافق عليه',
  PARTIALLY_PAID: 'مدفوع جزئياً',
  PAID: 'مدفوع',
  OVERDUE: 'متأخر',
  CANCELLED: 'ملغي',
};

export default function PurchaseBillsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/purchases/bills?${params}`);
      const data = await res.json();

      if (data.success) {
        setBills(data.data.bills);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching purchase bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف فاتورة الشراء؟')) return;

    try {
      const res = await fetch(`/api/v1/purchases/bills/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchBills();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handlePost = async (id: string) => {
    if (!confirm('هل أنت متأكد من ترحيل فاتورة الشراء؟ سيتم إنشاء قيد محاسبي وتحديث المخزون.')) return;

    try {
      const res = await fetch(`/api/v1/purchases/bills/${id}/post`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchBills();
        alert('تم ترحيل الفاتورة بنجاح');
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2,
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
          <h1 className="text-2xl font-bold">فواتير الشراء</h1>
          <p className="text-muted-foreground">إدارة فواتير الشراء من الموردين</p>
        </div>
        <Button onClick={() => router.push('/purchases/bills/new')}>
          <Plus className="h-4 w-4 me-2" />
          فاتورة شراء جديدة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو اسم المورد..."
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="حالة الفاتورة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="DRAFT">مسودة</SelectItem>
            <SelectItem value="PENDING_APPROVAL">في انتظار الموافقة</SelectItem>
            <SelectItem value="APPROVED">موافق عليه</SelectItem>
            <SelectItem value="PARTIALLY_PAID">مدفوع جزئياً</SelectItem>
            <SelectItem value="PAID">مدفوع</SelectItem>
            <SelectItem value="OVERDUE">متأخر</SelectItem>
            <SelectItem value="CANCELLED">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
              <TableHead>المجموع</TableHead>
              <TableHead>المدفوع</TableHead>
              <TableHead>المتبقي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  لا توجد فواتير شراء
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => {
                const total = Number(bill.total);
                const paid = Number(bill.paidAmount);
                const remaining = total - paid;

                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bill.supplier.nameAr}</div>
                        <div className="text-sm text-muted-foreground">
                          {bill.supplier.code}
                        </div>
                        {bill.purchaseOrder && (
                          <div className="text-xs text-muted-foreground mt-1">
                            أمر: {bill.purchaseOrder.poNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(bill.date)}</TableCell>
                    <TableCell>{formatDate(bill.dueDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(bill.total)}
                    </TableCell>
                    <TableCell>{formatCurrency(bill.paidAmount)}</TableCell>
                    <TableCell className={remaining > 0 ? 'font-medium' : ''}>
                      {formatCurrency(remaining)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusColors[bill.status] as any}>
                          {statusLabels[bill.status]}
                        </Badge>
                        {bill.journalEntryId && (
                          <div className="text-xs text-muted-foreground">
                            مرحلة
                          </div>
                        )}
                      </div>
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
                            onClick={() => router.push(`/purchases/bills/${bill.id}`)}
                          >
                            <Eye className="h-4 w-4 me-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {bill.status === 'DRAFT' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => router.push(`/purchases/bills/${bill.id}/edit`)}
                              >
                                <FileText className="h-4 w-4 me-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePost(bill.id)}
                              >
                                <Receipt className="h-4 w-4 me-2" />
                                ترحيل
                              </DropdownMenuItem>
                            </>
                          )}
                          {bill.status === 'DRAFT' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(bill.id)}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                حذف
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            عرض {bills.length} من {pagination.total} فاتورة شراء
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
