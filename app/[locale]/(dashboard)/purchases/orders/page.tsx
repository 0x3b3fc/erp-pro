'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, FileText, Eye, Trash2, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
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

interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  expectedDate: string | null;
  subtotal: string;
  vatAmount: string;
  total: string;
  status: string;
  supplier: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  };
  _count: {
    lines: number;
    bills: number;
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
  PARTIALLY_RECEIVED: 'default',
  RECEIVED: 'default',
  CANCELLED: 'destructive',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING_APPROVAL: 'في انتظار الموافقة',
  APPROVED: 'موافق عليه',
  PARTIALLY_RECEIVED: 'مستلم جزئياً',
  RECEIVED: 'مستلم',
  CANCELLED: 'ملغي',
};

export default function PurchaseOrdersPage() {
  const t = useTranslations();
  const router = useRouter();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/purchases/orders?${params}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف أمر الشراء؟')) return;

    try {
      const res = await fetch(`/api/v1/purchases/orders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/purchases/orders/${id}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchOrders();
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
          <h1 className="text-2xl font-bold">أوامر الشراء</h1>
          <p className="text-muted-foreground">إدارة أوامر الشراء من الموردين</p>
        </div>
        <Button onClick={() => router.push('/purchases/orders/new')}>
          <Plus className="h-4 w-4 me-2" />
          أمر شراء جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الأمر أو اسم المورد..."
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
            <SelectValue placeholder="حالة الأمر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="DRAFT">مسودة</SelectItem>
            <SelectItem value="PENDING_APPROVAL">في انتظار الموافقة</SelectItem>
            <SelectItem value="APPROVED">موافق عليه</SelectItem>
            <SelectItem value="PARTIALLY_RECEIVED">مستلم جزئياً</SelectItem>
            <SelectItem value="RECEIVED">مستلم</SelectItem>
            <SelectItem value="CANCELLED">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الأمر</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>تاريخ الاستلام المتوقع</TableHead>
              <TableHead>المجموع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>البنود</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  لا توجد أوامر شراء
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    {order.poNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.supplier.nameAr}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.supplier.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    {order.expectedDate ? formatDate(order.expectedDate) : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] as any}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order._count.lines} منتج
                      {order._count.bills > 0 && (
                        <span className="text-muted-foreground ms-2">
                          ({order._count.bills} فاتورة)
                        </span>
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
                          onClick={() => router.push(`/purchases/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 me-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        {order.status === 'DRAFT' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => router.push(`/purchases/orders/${order.id}/edit`)}
                            >
                              <FileText className="h-4 w-4 me-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleApprove(order.id)}
                            >
                              <CheckCircle className="h-4 w-4 me-2" />
                              موافقة
                            </DropdownMenuItem>
                          </>
                        )}
                        {order.status === 'DRAFT' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(order.id)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            عرض {orders.length} من {pagination.total} أمر شراء
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
