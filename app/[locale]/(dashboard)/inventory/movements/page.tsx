'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Package, ArrowUp, ArrowDown, RefreshCw, Plus, Filter } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StockMovement {
  id: string;
  movementType: string;
  quantity: string;
  costPrice: string;
  referenceType: string;
  referenceId: string;
  date: string;
  notes: string | null;
  product: {
    id: string;
    sku: string;
    nameAr: string;
    nameEn: string;
    unitOfMeasure: string;
  };
  warehouse: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const movementTypeLabels: Record<string, string> = {
  IN: 'دخول',
  OUT: 'خروج',
  ADJUSTMENT: 'تعديل',
  TRANSFER_IN: 'نقل داخلي (دخول)',
  TRANSFER_OUT: 'نقل داخلي (خروج)',
};

const movementTypeColors: Record<string, string> = {
  IN: 'default',
  OUT: 'destructive',
  ADJUSTMENT: 'secondary',
  TRANSFER_IN: 'default',
  TRANSFER_OUT: 'destructive',
};

const referenceTypeLabels: Record<string, string> = {
  BILL: 'فاتورة شراء',
  INVOICE: 'فاتورة مبيعات',
  ADJUSTMENT: 'تعديل يدوي',
  TRANSFER: 'نقل',
  POS: 'نقطة بيع',
};

export default function StockMovementsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>('all');
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; nameAr: string }>>([]);
  const [page, setPage] = useState(1);

  // Load warehouses for filter
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/v1/inventory/warehouses?limit=100');
        const data = await res.json();
        if (data.success) {
          setWarehouses(data.data.warehouses);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };
    fetchWarehouses();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.set('search', search);
      if (warehouseFilter && warehouseFilter !== 'all') {
        params.set('warehouseId', warehouseFilter);
      }
      if (movementTypeFilter && movementTypeFilter !== 'all') {
        params.set('movementType', movementTypeFilter);
      }
      if (referenceTypeFilter && referenceTypeFilter !== 'all') {
        params.set('referenceType', referenceTypeFilter);
      }

      const res = await fetch(`/api/v1/inventory/stock-movements?${params}`);
      const data = await res.json();

      if (data.success) {
        setMovements(data.data.movements);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, warehouseFilter, movementTypeFilter, referenceTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMovements();
  };

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">حركات المخزون</h1>
          <p className="text-muted-foreground">سجل جميع حركات المخزون (دخول، خروج، تعديلات)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/inventory/stock-levels')}>
            <Package className="h-4 w-4 me-2" />
            مستويات المخزون
          </Button>
          <Button onClick={() => router.push('/inventory/movements/adjust')}>
            <Plus className="h-4 w-4 me-2" />
            تعديل مخزون
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالمنتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="المخزن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المخازن</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="نوع الحركة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="IN">دخول</SelectItem>
            <SelectItem value="OUT">خروج</SelectItem>
            <SelectItem value="ADJUSTMENT">تعديل</SelectItem>
            <SelectItem value="TRANSFER_IN">نقل داخلي (دخول)</SelectItem>
            <SelectItem value="TRANSFER_OUT">نقل داخلي (خروج)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={referenceTypeFilter} onValueChange={setReferenceTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="المصدر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المصادر</SelectItem>
            <SelectItem value="BILL">فاتورة شراء</SelectItem>
            <SelectItem value="INVOICE">فاتورة مبيعات</SelectItem>
            <SelectItem value="ADJUSTMENT">تعديل يدوي</SelectItem>
            <SelectItem value="TRANSFER">نقل</SelectItem>
            <SelectItem value="POS">نقطة بيع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المنتج</TableHead>
              <TableHead>المخزن</TableHead>
              <TableHead>نوع الحركة</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>سعر التكلفة</TableHead>
              <TableHead>المصدر</TableHead>
              <TableHead>ملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  لا توجد حركات مخزون
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => {
                const isIn = ['IN', 'TRANSFER_IN'].includes(movement.movementType);
                const isOut = ['OUT', 'TRANSFER_OUT'].includes(movement.movementType);

                return (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {formatDate(movement.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product.nameAr}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {movement.product.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{movement.warehouse.nameAr}</div>
                      <div className="text-xs text-muted-foreground">
                        {movement.warehouse.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={movementTypeColors[movement.movementType] as any}
                        className="flex items-center gap-1 w-fit"
                      >
                        {isIn ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : isOut ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        {movementTypeLabels[movement.movementType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {isOut ? '-' : '+'}
                      {formatNumber(movement.quantity)} {movement.product.unitOfMeasure}
                    </TableCell>
                    <TableCell>{formatCurrency(movement.costPrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {referenceTypeLabels[movement.referenceType] || movement.referenceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {movement.notes || '-'}
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
            عرض {movements.length} من {pagination.total} حركة
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
