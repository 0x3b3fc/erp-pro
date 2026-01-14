'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    Search,
    Package,
    AlertTriangle,
    Warehouse,
    Loader2,
    ArrowUpDown,
    DollarSign,
    Boxes,
    TrendingDown,
    BarChart3,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface StockLevel {
    id: string;
    quantity: string;
    reservedQty: string;
    avgCost: string;
    product: {
        id: string;
        sku: string;
        nameAr: string;
        nameEn: string | null;
        unitOfMeasure: string;
        reorderPoint: string | null;
        reorderQty: string | null;
    };
    warehouse: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string | null;
    };
}

interface Stats {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
    outOfStockCount: number;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface WarehouseOption {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
}

function StockLevelsContent() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isRTL = locale === 'ar';

    const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>(searchParams.get('warehouseId') || 'all');
    const [lowStockFilter, setLowStockFilter] = useState<string>('all');
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [page, setPage] = useState(1);

    // Load warehouses for filter
    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await fetch('/api/v1/inventory/warehouses?limit=100');
                const data = await res.json();
                if (data.success) {
                    setWarehouses(data.data.warehouses || []);
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
            if (lowStockFilter === 'outOfStock') {
                params.set('outOfStock', 'true');
            }

            const res = await fetch(`/api/v1/inventory/stock-levels?${params}`);
            const data = await res.json();

            if (data.success) {
                setStockLevels(data.data.stockLevels || []);
                setPagination(data.data.pagination);
                if (data.data.stats) setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stock levels:', error);
            toast.error(t('common.error'));
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
        return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(Number(num));
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

    const getProductName = (product: StockLevel['product']) => {
        return isRTL ? product.nameAr : (product.nameEn || product.nameAr);
    };

    const getWarehouseName = (warehouse: StockLevel['warehouse']) => {
        return isRTL ? warehouse.nameAr : (warehouse.nameEn || warehouse.nameAr);
    };

    const isLowStock = (stockLevel: StockLevel) => {
        const qty = Number(stockLevel.quantity);
        const reorderPoint = Number(stockLevel.product.reorderPoint || 0);
        return qty <= reorderPoint && reorderPoint > 0;
    };

    const isOutOfStock = (stockLevel: StockLevel) => {
        return Number(stockLevel.quantity) <= 0;
    };

    const availableQty = (stockLevel: StockLevel) => {
        return Number(stockLevel.quantity) - Number(stockLevel.reservedQty);
    };

    const calculateTotalValue = () => {
        return stockLevels.reduce(
            (sum, sl) => sum + Number(sl.quantity) * Number(sl.avgCost),
            0
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        {isRTL ? 'مستويات المخزون' : 'Stock Levels'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isRTL ? 'عرض المخزون الحالي في جميع المخازن' : 'View current stock levels across all warehouses'}
                    </p>
                </div>
                <Button
                    onClick={() => router.push(`/${locale}/inventory/movements`)}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg shadow-teal-500/25"
                >
                    <ArrowUpDown className="h-4 w-4 me-2" />
                    {isRTL ? 'حركات المخزون' : 'Stock Movements'}
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
                                    {stats?.totalProducts ?? pagination?.total ?? 0}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {stats?.lowStockCount ?? stockLevels.filter(isLowStock).length}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'نفذ من المخزون' : 'Out of Stock'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {stats?.outOfStockCount ?? stockLevels.filter(isOutOfStock).length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي قيمة المخزون' : 'Total Value'}</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(stats?.totalValue ?? calculateTotalValue())}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={isRTL ? 'بحث بكود المنتج أو الاسم...' : 'Search by product SKU or name...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>

                        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                            <SelectTrigger className="w-full md:w-[200px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={isRTL ? 'المخزن' : 'Warehouse'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {isRTL ? warehouse.nameAr : (warehouse.nameEn || warehouse.nameAr)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={lowStockFilter} onValueChange={setLowStockFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={isRTL ? 'حالة المخزون' : 'Stock Status'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="true">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</SelectItem>
                                <SelectItem value="outOfStock">{isRTL ? 'نفذ من المخزون' : 'Out of Stock'}</SelectItem>
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
                            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                        </div>
                    ) : stockLevels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('common.noResults')}</p>
                            <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على بيانات مخزون' : 'No stock data found'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المنتج' : 'Product'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المخزن' : 'Warehouse'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'الكمية' : 'Quantity'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'محجوز' : 'Reserved'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'متاح' : 'Available'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{isRTL ? 'متوسط التكلفة' : 'Avg Cost'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{isRTL ? 'القيمة' : 'Value'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockLevels.map((stockLevel) => {
                                        const lowStock = isLowStock(stockLevel);
                                        const outOfStock = isOutOfStock(stockLevel);
                                        const value = Number(stockLevel.quantity) * Number(stockLevel.avgCost);

                                        return (
                                            <TableRow
                                                key={stockLevel.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${outOfStock
                                                                ? 'bg-red-50 dark:bg-red-500/10'
                                                                : lowStock
                                                                    ? 'bg-orange-50 dark:bg-orange-500/10'
                                                                    : 'bg-slate-100 dark:bg-slate-700'
                                                            }`}>
                                                            <Package className={`h-4 w-4 ${outOfStock
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : lowStock
                                                                        ? 'text-orange-600 dark:text-orange-400'
                                                                        : 'text-slate-600 dark:text-slate-400'
                                                                }`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {getProductName(stockLevel.product)}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {stockLevel.product.sku}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {getWarehouseName(stockLevel.warehouse)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`font-semibold ${outOfStock
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : lowStock
                                                                ? 'text-orange-600 dark:text-orange-400'
                                                                : 'text-slate-900 dark:text-white'
                                                        }`}>
                                                        {formatNumber(stockLevel.quantity)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-slate-600 dark:text-slate-300">
                                                        {formatNumber(stockLevel.reservedQty)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`font-semibold ${availableQty(stockLevel) <= 0
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {formatNumber(availableQty(stockLevel))}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className="text-slate-600 dark:text-slate-300">
                                                        {formatCurrency(stockLevel.avgCost)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {formatCurrency(value)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {outOfStock ? (
                                                        <Badge className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
                                                            <TrendingDown className="h-3 w-3" />
                                                            {isRTL ? 'نفذ' : 'Out'}
                                                        </Badge>
                                                    ) : lowStock ? (
                                                        <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {isRTL ? 'منخفض' : 'Low'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                                            {isRTL ? 'متوفر' : 'In Stock'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
                            ? `عرض ${stockLevels.length} من ${pagination.total} منتج`
                            : `Showing ${stockLevels.length} of ${pagination.total} products`
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
        </div>
    );
}

export default function StockLevelsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <StockLevelsContent />
        </Suspense>
    );
}
