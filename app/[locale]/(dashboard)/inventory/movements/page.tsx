'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    Search,
    Package,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Plus,
    Loader2,
    ArrowUpDown,
    Warehouse,
    Calendar,
    FileText,
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
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
        nameEn: string | null;
        unitOfMeasure: string;
    };
    warehouse: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string | null;
    };
}

interface Stats {
    totalIn: number;
    totalOut: number;
    totalAdjustments: number;
    totalTransfers: number;
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

const movementTypeConfig: Record<string, { icon: any; color: string; bgColor: string; darkBgColor: string }> = {
    IN: { icon: ArrowDown, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-500/10' },
    OUT: { icon: ArrowUp, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-500/10' },
    ADJUSTMENT: { icon: RefreshCw, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-500/10' },
    TRANSFER_IN: { icon: ArrowRightLeft, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100', darkBgColor: 'dark:bg-purple-500/10' },
    TRANSFER_OUT: { icon: ArrowRightLeft, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100', darkBgColor: 'dark:bg-orange-500/10' },
};

export default function StockMovementsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const isRTL = locale === 'ar';

    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
    const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>('all');
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
                setMovements(data.data.movements || []);
                setPagination(data.data.pagination);
                if (data.data.stats) setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stock movements:', error);
            toast.error(t('common.error'));
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMovementTypeLabel = (type: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            IN: { ar: 'دخول', en: 'In' },
            OUT: { ar: 'خروج', en: 'Out' },
            ADJUSTMENT: { ar: 'تعديل', en: 'Adjustment' },
            TRANSFER_IN: { ar: 'نقل (دخول)', en: 'Transfer In' },
            TRANSFER_OUT: { ar: 'نقل (خروج)', en: 'Transfer Out' },
        };
        return labels[type]?.[isRTL ? 'ar' : 'en'] || type;
    };

    const getReferenceTypeLabel = (type: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            BILL: { ar: 'فاتورة شراء', en: 'Purchase Bill' },
            INVOICE: { ar: 'فاتورة مبيعات', en: 'Sales Invoice' },
            ADJUSTMENT: { ar: 'تعديل يدوي', en: 'Manual Adjustment' },
            TRANSFER: { ar: 'نقل', en: 'Transfer' },
            POS: { ar: 'نقطة بيع', en: 'POS' },
        };
        return labels[type]?.[isRTL ? 'ar' : 'en'] || type;
    };

    const getProductName = (product: StockMovement['product']) => {
        return isRTL ? product.nameAr : (product.nameEn || product.nameAr);
    };

    const getWarehouseName = (warehouse: StockMovement['warehouse']) => {
        return isRTL ? warehouse.nameAr : (warehouse.nameEn || warehouse.nameAr);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg shadow-violet-500/20">
                            <ArrowUpDown className="h-6 w-6 text-white" />
                        </div>
                        {isRTL ? 'حركات المخزون' : 'Stock Movements'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isRTL ? 'سجل جميع حركات المخزون (دخول، خروج، تعديلات)' : 'Record of all stock movements (in, out, adjustments)'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/${locale}/inventory/stock-levels`)}
                        className="border-slate-200 dark:border-slate-700"
                    >
                        <Package className="h-4 w-4 me-2" />
                        {isRTL ? 'مستويات المخزون' : 'Stock Levels'}
                    </Button>
                    <Button
                        onClick={() => router.push(`/${locale}/inventory/movements/adjust`)}
                        className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-500/25"
                    >
                        <Plus className="h-4 w-4 me-2" />
                        {isRTL ? 'تعديل مخزون' : 'Adjust Stock'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'حركات الدخول' : 'Incoming'}</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {stats?.totalIn ?? 0}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                                <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'حركات الخروج' : 'Outgoing'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {stats?.totalOut ?? 0}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'التعديلات' : 'Adjustments'}</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {stats?.totalAdjustments ?? 0}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? 'التحويلات' : 'Transfers'}</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {stats?.totalTransfers ?? 0}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                                <ArrowRightLeft className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
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
                            <SelectTrigger className="w-full lg:w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
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

                        <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                            <SelectTrigger className="w-full lg:w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={isRTL ? 'نوع الحركة' : 'Movement Type'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="IN">{isRTL ? 'دخول' : 'In'}</SelectItem>
                                <SelectItem value="OUT">{isRTL ? 'خروج' : 'Out'}</SelectItem>
                                <SelectItem value="ADJUSTMENT">{isRTL ? 'تعديل' : 'Adjustment'}</SelectItem>
                                <SelectItem value="TRANSFER_IN">{isRTL ? 'نقل (دخول)' : 'Transfer In'}</SelectItem>
                                <SelectItem value="TRANSFER_OUT">{isRTL ? 'نقل (خروج)' : 'Transfer Out'}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={referenceTypeFilter} onValueChange={setReferenceTypeFilter}>
                            <SelectTrigger className="w-full lg:w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={isRTL ? 'المرجع' : 'Reference'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="BILL">{isRTL ? 'فاتورة شراء' : 'Purchase Bill'}</SelectItem>
                                <SelectItem value="INVOICE">{isRTL ? 'فاتورة مبيعات' : 'Sales Invoice'}</SelectItem>
                                <SelectItem value="ADJUSTMENT">{isRTL ? 'تعديل يدوي' : 'Manual Adjustment'}</SelectItem>
                                <SelectItem value="TRANSFER">{isRTL ? 'نقل' : 'Transfer'}</SelectItem>
                                <SelectItem value="POS">{isRTL ? 'نقطة بيع' : 'POS'}</SelectItem>
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
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                            <ArrowUpDown className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('common.noResults')}</p>
                            <p className="text-sm mt-1">{isRTL ? 'لم يتم العثور على حركات مخزون' : 'No stock movements found'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المنتج' : 'Product'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المخزن' : 'Warehouse'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'نوع الحركة' : 'Type'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">{isRTL ? 'الكمية' : 'Quantity'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-end">{isRTL ? 'سعر التكلفة' : 'Cost'}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المرجع' : 'Reference'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((movement) => {
                                        const typeConfig = movementTypeConfig[movement.movementType] || movementTypeConfig.ADJUSTMENT;
                                        const TypeIcon = typeConfig.icon;

                                        return (
                                            <TableRow
                                                key={movement.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {formatDate(movement.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                            <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {getProductName(movement.product)}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {movement.product.sku}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {getWarehouseName(movement.warehouse)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${typeConfig.bgColor} ${typeConfig.darkBgColor} ${typeConfig.color} border-0 gap-1`}>
                                                        <TypeIcon className="h-3 w-3" />
                                                        {getMovementTypeLabel(movement.movementType)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`font-semibold ${movement.movementType === 'IN' || movement.movementType === 'TRANSFER_IN'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : movement.movementType === 'OUT' || movement.movementType === 'TRANSFER_OUT'
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-blue-600 dark:text-blue-400'
                                                        }`}>
                                                        {movement.movementType === 'IN' || movement.movementType === 'TRANSFER_IN'
                                                            ? '+'
                                                            : movement.movementType === 'OUT' || movement.movementType === 'TRANSFER_OUT'
                                                                ? '-'
                                                                : ''
                                                        }
                                                        {formatNumber(movement.quantity)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className="text-slate-600 dark:text-slate-300">
                                                        {formatCurrency(movement.costPrice)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {getReferenceTypeLabel(movement.referenceType)}
                                                        </span>
                                                    </div>
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
                            ? `عرض ${movements.length} من ${pagination.total} حركة`
                            : `Showing ${movements.length} of ${pagination.total} movements`
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
