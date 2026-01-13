'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Package, AlertTriangle, Warehouse, Filter } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockLevel {
  id: string;
  quantity: string;
  reservedQty: string;
  avgCost: string;
  product: {
    id: string;
    sku: string;
    nameAr: string;
    nameEn: string;
    unitOfMeasure: string;
    reorderPoint: string;
    reorderQty: string;
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

export default function StockLevelsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState<string>('all');
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

  const fetchStockLevels = async () => {
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
      if (lowStockFilter === 'true') {
        params.set('lowStock', 'true');
      }

      const res = await fetch(`/api/v1/inventory/stock-levels?${params}`);
      const data = await res.json();

      if (data.success) {
        setStockLevels(data.data.stockLevels);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLevels();
  }, [page, warehouseFilter, lowStockFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStockLevels();
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

  const isLowStock = (stockLevel: StockLevel) => {
    const qty = Number(stockLevel.quantity);
    const reorderPoint = Number(stockLevel.product.reorderPoint || 0);
    return qty <= reorderPoint && reorderPoint > 0;
  };

  const availableQty = (stockLevel: StockLevel) => {
    return Number(stockLevel.quantity) - Number(stockLevel.reservedQty);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">مستويات المخزون</h1>
          <p className="text-muted-foreground">عرض المخزون الحالي في جميع المخازن</p>
        </div>
        <Button onClick={() => router.push('/inventory/movements')}>
          <Package className="h-4 w-4 me-2" />
          حركات المخزون
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">منتج في المخازن</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منتجات مخزون منخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stockLevels.filter(isLowStock).length}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج إعادة طلب</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي قيمة المخزون</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stockLevels.reduce(
                  (sum, sl) => sum + Number(sl.quantity) * Number(sl.avgCost),
                  0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">قيمة المخزون الحالي</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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
          <SelectTrigger className="w-[200px]">
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

        <Select value={lowStockFilter} onValueChange={setLowStockFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="مخزون منخفض" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="true">مخزون منخفض فقط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>المخزن</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>المحجوز</TableHead>
              <TableHead>المتاح</TableHead>
              <TableHead>متوسط التكلفة</TableHead>
              <TableHead>قيمة المخزون</TableHead>
              <TableHead>نقطة إعادة الطلب</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : stockLevels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  لا توجد بيانات مخزون
                </TableCell>
              </TableRow>
            ) : (
              stockLevels.map((stockLevel) => {
                const qty = Number(stockLevel.quantity);
                const reserved = Number(stockLevel.reservedQty);
                const available = availableQty(stockLevel);
                const avgCost = Number(stockLevel.avgCost);
                const stockValue = qty * avgCost;
                const reorderPoint = Number(stockLevel.product.reorderPoint || 0);
                const lowStock = isLowStock(stockLevel);

                return (
                  <TableRow key={stockLevel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stockLevel.product.nameAr}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {stockLevel.product.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{stockLevel.warehouse.nameAr}</div>
                          <div className="text-sm text-muted-foreground">
                            {stockLevel.warehouse.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(qty)} {stockLevel.product.unitOfMeasure}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatNumber(reserved)} {stockLevel.product.unitOfMeasure}
                    </TableCell>
                    <TableCell className={available < 0 ? 'text-destructive font-medium' : ''}>
                      {formatNumber(available)} {stockLevel.product.unitOfMeasure}
                    </TableCell>
                    <TableCell>{formatCurrency(avgCost)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(stockValue)}
                    </TableCell>
                    <TableCell>
                      {reorderPoint > 0 ? (
                        <div>
                          <div>{formatNumber(reorderPoint)} {stockLevel.product.unitOfMeasure}</div>
                          {Number(stockLevel.product.reorderQty) > 0 && (
                            <div className="text-xs text-muted-foreground">
                              كمية الطلب: {formatNumber(stockLevel.product.reorderQty)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {lowStock ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          مخزون منخفض
                        </Badge>
                      ) : (
                        <Badge variant="default">طبيعي</Badge>
                      )}
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
            عرض {stockLevels.length} من {pagination.total} منتج
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
