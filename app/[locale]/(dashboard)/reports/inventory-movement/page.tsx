'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Package,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Download,
    Filter,
    Search,
    TrendingUp,
    TrendingDown,
    Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Movement {
    id: string;
    date: string;
    productCode: string;
    productName: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    reason: string;
    reference: string;
    warehouse: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    balanceAfter: number;
}

interface MovementSummary {
    totalIn: number;
    totalOut: number;
    netChange: number;
    totalValue: number;
    movementCount: number;
}

export default function InventoryMovementReportPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [summary, setSummary] = useState<MovementSummary | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('month');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/reports/inventory-movements?period=${dateRange}&type=${typeFilter}&warehouse=${warehouseFilter}`);
            const result = await res.json();
            if (result.data) {
                setMovements(result.data.movements);
                setSummary(result.data.summary);
            }
        } catch (error) {
            console.error('Error fetching inventory movements:', error);
            // Demo data
            const demoMovements: Movement[] = [
                { id: '1', date: '2024-01-15', productCode: 'SKU001', productName: 'لابتوب ديل', type: 'in', reason: 'أمر شراء', reference: 'PO-2024-001', warehouse: 'المستودع الرئيسي', quantity: 50, unitCost: 15000, totalValue: 750000, balanceAfter: 150 },
                { id: '2', date: '2024-01-14', productCode: 'SKU002', productName: 'شاشة سامسونج', type: 'out', reason: 'فاتورة مبيعات', reference: 'INV-2024-045', warehouse: 'المستودع الرئيسي', quantity: 10, unitCost: 5000, totalValue: 50000, balanceAfter: 40 },
                { id: '3', date: '2024-01-13', productCode: 'SKU003', productName: 'طابعة HP', type: 'transfer', reason: 'تحويل مخزني', reference: 'TR-2024-005', warehouse: 'فرع المعادي', quantity: 20, unitCost: 3000, totalValue: 60000, balanceAfter: 80 },
                { id: '4', date: '2024-01-12', productCode: 'SKU001', productName: 'لابتوب ديل', type: 'out', reason: 'فاتورة مبيعات', reference: 'INV-2024-042', warehouse: 'المستودع الرئيسي', quantity: 5, unitCost: 15000, totalValue: 75000, balanceAfter: 100 },
                { id: '5', date: '2024-01-11', productCode: 'SKU004', productName: 'ماوس لوجيتك', type: 'adjustment', reason: 'تسوية جرد', reference: 'ADJ-2024-001', warehouse: 'المستودع الرئيسي', quantity: -3, unitCost: 200, totalValue: -600, balanceAfter: 97 },
                { id: '6', date: '2024-01-10', productCode: 'SKU002', productName: 'شاشة سامسونج', type: 'in', reason: 'مرتجع مبيعات', reference: 'RET-2024-003', warehouse: 'المستودع الرئيسي', quantity: 2, unitCost: 5000, totalValue: 10000, balanceAfter: 50 },
            ];

            const totalIn = demoMovements.filter(m => m.type === 'in' || (m.type === 'adjustment' && m.quantity > 0)).reduce((sum, m) => sum + Math.abs(m.quantity), 0);
            const totalOut = demoMovements.filter(m => m.type === 'out' || m.type === 'transfer' || (m.type === 'adjustment' && m.quantity < 0)).reduce((sum, m) => sum + Math.abs(m.quantity), 0);

            setSummary({
                totalIn,
                totalOut,
                netChange: totalIn - totalOut,
                totalValue: demoMovements.reduce((sum, m) => sum + Math.abs(m.totalValue), 0),
                movementCount: demoMovements.length,
            });
            setMovements(demoMovements);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, typeFilter, warehouseFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + (locale === 'ar' ? ' ج.م' : ' EGP');
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG');
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, Record<string, string>> = {
            in: { ar: 'وارد', en: 'In' },
            out: { ar: 'صادر', en: 'Out' },
            transfer: { ar: 'تحويل', en: 'Transfer' },
            adjustment: { ar: 'تسوية', en: 'Adjustment' },
        };
        return labels[type]?.[locale] || type;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'in': return 'bg-green-500 text-white';
            case 'out': return 'bg-red-500 text-white';
            case 'transfer': return 'bg-blue-500 text-white';
            case 'adjustment': return 'bg-yellow-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const filteredMovements = movements.filter(m => {
        if (searchTerm && !m.productName.toLowerCase().includes(searchTerm.toLowerCase()) && !m.productCode.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'تقرير حركة المخزون' : 'Inventory Movement Report'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'متابعة جميع حركات الدخول والخروج للمخزون'
                            : 'Track all inventory in and out movements'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={locale === 'ar' ? 'بحث بالمنتج...' : 'Search by product...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ps-9"
                            />
                        </div>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="h-4 w-4 me-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">{locale === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                                <SelectItem value="week">{locale === 'ar' ? 'هذا الأسبوع' : 'This Week'}</SelectItem>
                                <SelectItem value="month">{locale === 'ar' ? 'هذا الشهر' : 'This Month'}</SelectItem>
                                <SelectItem value="quarter">{locale === 'ar' ? 'هذا الربع' : 'This Quarter'}</SelectItem>
                                <SelectItem value="year">{locale === 'ar' ? 'هذه السنة' : 'This Year'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="h-4 w-4 me-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل الأنواع' : 'All Types'}</SelectItem>
                                <SelectItem value="in">{locale === 'ar' ? 'وارد' : 'In'}</SelectItem>
                                <SelectItem value="out">{locale === 'ar' ? 'صادر' : 'Out'}</SelectItem>
                                <SelectItem value="transfer">{locale === 'ar' ? 'تحويل' : 'Transfer'}</SelectItem>
                                <SelectItem value="adjustment">{locale === 'ar' ? 'تسوية' : 'Adjustment'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Package className="h-4 w-4 me-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل المستودعات' : 'All Warehouses'}</SelectItem>
                                <SelectItem value="main">{locale === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse'}</SelectItem>
                                <SelectItem value="branch1">{locale === 'ar' ? 'فرع المعادي' : 'Maadi Branch'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid gap-4 md:grid-cols-5">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                                        {locale === 'ar' ? 'إجمالي الوارد' : 'Total In'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        +{summary.totalIn.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'وحدة' : 'units'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                                        {locale === 'ar' ? 'إجمالي الصادر' : 'Total Out'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        -{summary.totalOut.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'وحدة' : 'units'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        {summary.netChange >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        )}
                                        {locale === 'ar' ? 'صافي التغيير' : 'Net Change'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {summary.netChange >= 0 ? '+' : ''}{summary.netChange.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'وحدة' : 'units'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {locale === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(summary.totalValue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'قيمة الحركات' : 'movements value'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {locale === 'ar' ? 'عدد الحركات' : 'Movement Count'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {summary.movementCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'حركة' : 'movements'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Movements Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {locale === 'ar' ? 'تفاصيل الحركات' : 'Movement Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'النوع' : 'Type'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'المرجع' : 'Reference'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'المستودع' : 'Warehouse'}</TableHead>
                                        <TableHead className="text-center">{locale === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'سعر الوحدة' : 'Unit Cost'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'القيمة' : 'Value'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الرصيد' : 'Balance'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell className="text-muted-foreground">{formatDate(movement.date)}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{movement.productName}</div>
                                                    <div className="text-xs text-muted-foreground">{movement.productCode}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getTypeColor(movement.type)}>
                                                    {getTypeLabel(movement.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{movement.reason}</TableCell>
                                            <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
                                            <TableCell>{movement.warehouse}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-bold ${movement.type === 'in' || (movement.type === 'adjustment' && movement.quantity > 0) ? 'text-green-600' : 'text-red-600'}`}>
                                                    {movement.type === 'in' || (movement.type === 'adjustment' && movement.quantity > 0) ? '+' : '-'}
                                                    {Math.abs(movement.quantity)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatCurrency(movement.unitCost)}</TableCell>
                                            <TableCell>{formatCurrency(Math.abs(movement.totalValue))}</TableCell>
                                            <TableCell className="font-medium">{movement.balanceAfter}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
