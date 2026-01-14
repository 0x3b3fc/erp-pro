'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  Loader2,
  Eye,
  BarChart3,
  DollarSign,
  PackageCheck,
  Boxes,
  Tag,
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

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string | null;
  salePrice: string;
  costPrice: string | null;
  vatRate: number;
  unitOfMeasure: string;
  isActive: boolean;
  barcode: string | null;
  etaCode: string | null;
  reorderPoint: number | null;
  totalStock: number;
  category: {
    id: string;
    nameAr: string;
    nameEn: string | null;
  } | null;
}

interface Stats {
  total: number;
  active: number;
  lowStock: number;
  totalValue: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const unitLabels: Record<string, { ar: string; en: string }> = {
  EA: { ar: 'قطعة', en: 'Each' },
  KGM: { ar: 'كيلوجرام', en: 'Kilogram' },
  MTR: { ar: 'متر', en: 'Meter' },
  LTR: { ar: 'لتر', en: 'Liter' },
  PR: { ar: 'زوج', en: 'Pair' },
  BX: { ar: 'صندوق', en: 'Box' },
  DZ: { ar: 'دستة', en: 'Dozen' },
};

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (stockFilter !== 'all') params.set('stockFilter', stockFilter);

      const res = await fetch(`/api/v1/inventory/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.products || []);
        setPagination(data.data.pagination);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter, stockFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/inventory/products/${deleteDialog.product.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t('common.success'));
        setDeleteDialog({ open: false, product: null });
        fetchProducts();
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

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getUnitLabel = (unit: string) => {
    return unitLabels[unit]?.[isRTL ? 'ar' : 'en'] || unit;
  };

  const getProductName = (product: Product) => {
    return isRTL ? product.nameAr : (product.nameEn || product.nameAr);
  };

  const getCategoryName = (category: Product['category']) => {
    if (!category) return '-';
    return isRTL ? category.nameAr : (category.nameEn || category.nameAr);
  };

  const isLowStock = (product: Product) => {
    if (!product.reorderPoint) return false;
    return product.totalStock <= product.reorderPoint;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Package className="h-6 w-6 text-white" />
            </div>
            {t('navigation.products')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة المنتجات والأصناف' : 'Manage products and items'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/inventory/products/new`)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? 'منتج جديد' : 'New Product'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المنتجات' : 'Total Products'}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.total ?? pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'المنتجات النشطة' : 'Active Products'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.active ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                <PackageCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {stats?.lowStock ?? products.filter(isLowStock).length}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'قيمة المخزون' : 'Inventory Value'}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(stats?.totalValue ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isRTL ? 'بحث بالكود أو الاسم أو الباركود...' : 'Search by SKU, name or barcode...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                <SelectItem value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={isRTL ? 'حالة المخزون' : 'Stock Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="in_stock">{isRTL ? 'متوفر' : 'In Stock'}</SelectItem>
                <SelectItem value="low_stock">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</SelectItem>
                <SelectItem value="out_of_stock">{isRTL ? 'نفذ' : 'Out of Stock'}</SelectItem>
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
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('common.noResults')}</p>
              <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على منتجات' : 'No products found'}</p>
              <Button
                onClick={() => router.push(`/${locale}/inventory/products/new`)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 me-2" />
                {isRTL ? 'إضافة منتج جديد' : 'Add New Product'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('inventory.sku')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المنتج' : 'Product'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('inventory.category')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('inventory.unitOfMeasure')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{t('inventory.salesPrice')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{t('common.vat')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{t('inventory.currentStock')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/${locale}/inventory/products/${product.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                            <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{getProductName(product)}</p>
                            {product.barcode && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{product.barcode}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {getCategoryName(product.category)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {getUnitLabel(product.unitOfMeasure)}
                        </span>
                      </TableCell>
                      <TableCell className="text-end font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(product.salePrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700">
                          {product.vatRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isLowStock(product) && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className={`font-semibold ${product.totalStock <= 0
                              ? 'text-red-600 dark:text-red-400'
                              : isLowStock(product)
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                            {product.totalStock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={product.isActive
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'}>
                          {product.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
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
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/products/${product.id}`)}>
                              <Eye className="h-4 w-4 me-2" />
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/products/${product.id}/edit`)}>
                              <Edit className="h-4 w-4 me-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${locale}/inventory/stock-levels?productId=${product.id}`)}>
                              <BarChart3 className="h-4 w-4 me-2" />
                              {isRTL ? 'مستويات المخزون' : 'Stock Levels'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setDeleteDialog({ open: true, product })}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
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
              ? `عرض ${products.length} من ${pagination.total} منتج`
              : `Showing ${products.length} of ${pagination.total} products`
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
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
                  {deleteDialog.product && getProductName(deleteDialog.product)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deleteDialog.product?.sku}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, product: null })}
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
