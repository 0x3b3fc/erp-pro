'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Search,
  Warehouse,
  Edit,
  Trash2,
  MoreHorizontal,
  Star,
  Loader2,
  Eye,
  Package,
  ArrowUpDown,
  MapPin,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';

interface WarehouseItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  _count: {
    stockLevels: number;
    stockMovements: number;
  };
}

interface Stats {
  total: number;
  active: number;
  totalProducts: number;
  totalMovements: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function WarehousesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; warehouse: WarehouseItem | null }>({
    open: false,
    warehouse: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/inventory/warehouses?${params}`);
      const data = await res.json();

      if (data.success) {
        setWarehouses(data.data.warehouses || []);
        setPagination(data.data.pagination);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWarehouses();
  };

  const handleDelete = async () => {
    if (!deleteDialog.warehouse) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/inventory/warehouses/${deleteDialog.warehouse.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t('common.success'));
        setDeleteDialog({ open: false, warehouse: null });
        fetchWarehouses();
      } else {
        const data = await res.json();
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const getWarehouseName = (warehouse: WarehouseItem) => {
    return isRTL ? warehouse.nameAr : (warehouse.nameEn || warehouse.nameAr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            {isRTL ? 'المخازن' : 'Warehouses'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة المخازن والمستودعات' : 'Manage warehouses and storage locations'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/inventory/warehouses/new`)}
          className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/25"
        >
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? 'مخزن جديد' : 'New Warehouse'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المخازن' : 'Total Warehouses'}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.total ?? pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'المخازن النشطة' : 'Active Warehouses'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.active ?? warehouses.filter(w => w.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                <Warehouse className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المنتجات' : 'Total Products'}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {stats?.totalProducts ?? warehouses.reduce((sum, w) => sum + w._count.stockLevels, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي الحركات' : 'Total Movements'}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {stats?.totalMovements ?? warehouses.reduce((sum, w) => sum + w._count.stockMovements, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                <ArrowUpDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isRTL ? 'بحث بالكود أو الاسم...' : 'Search by code or name...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                <SelectItem value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" className="bg-slate-100 dark:bg-slate-700">
              <Search className="h-4 w-4 me-2" />
              {t('common.search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Warehouse className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('common.noResults')}</p>
              <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على مخازن' : 'No warehouses found'}</p>
              <Button
                onClick={() => router.push(`/${locale}/inventory/warehouses/new`)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 me-2" />
                {isRTL ? 'إضافة مخزن جديد' : 'Add New Warehouse'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'الكود' : 'Code'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المخزن' : 'Warehouse'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'العنوان' : 'Address'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'عدد المنتجات' : 'Products'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'عدد الحركات' : 'Movements'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow
                      key={warehouse.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/${locale}/inventory/warehouses/${warehouse.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {warehouse.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${warehouse.isDefault
                            ? 'bg-yellow-50 dark:bg-yellow-500/10'
                            : 'bg-cyan-50 dark:bg-cyan-500/10'}`}>
                            {warehouse.isDefault ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <Warehouse className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 dark:text-white">
                                {getWarehouseName(warehouse)}
                              </p>
                              {warehouse.isDefault && (
                                <Badge className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-xs">
                                  {isRTL ? 'افتراضي' : 'Default'}
                                </Badge>
                              )}
                            </div>
                            {warehouse.nameEn && isRTL && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{warehouse.nameEn}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {warehouse.address ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{warehouse.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            {warehouse._count.stockLevels}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            {warehouse._count.stockMovements}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={warehouse.isActive
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'}>
                          {warehouse.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/warehouses/${warehouse.id}`)}>
                              <Eye className="h-4 w-4 me-2" />
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/warehouses/${warehouse.id}/edit`)}>
                              <Edit className="h-4 w-4 me-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/stock-levels?warehouseId=${warehouse.id}`)}>
                              <Package className="h-4 w-4 me-2" />
                              {isRTL ? 'مستويات المخزون' : 'Stock Levels'}
                            </DropdownMenuItem>
                            {!warehouse.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => setDeleteDialog({ open: true, warehouse })}
                                >
                                  <Trash2 className="h-4 w-4 me-2" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? `عرض ${warehouses.length} من ${pagination.total} مخزن`
              : `Showing ${warehouses.length} of ${pagination.total} warehouses`
            }
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, warehouse: null })}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('common.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {deleteDialog.warehouse && getWarehouseName(deleteDialog.warehouse)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deleteDialog.warehouse?.code}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, warehouse: null })}
              className="border-slate-200 dark:border-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
