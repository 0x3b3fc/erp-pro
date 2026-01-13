'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Plus, Trash2, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Supplier {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  taxNumber: string | null;
}

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  costPrice: string;
  vatRate: number;
}

interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

interface OrderLine {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  warehouseId: string;
  // Calculated
  subtotal: number;
  vatAmount: number;
  total: number;
}

export default function NewPurchaseOrderPage() {
  const t = useTranslations();
  const router = useRouter();

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  // Selected supplier
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes, warehousesRes] = await Promise.all([
          fetch('/api/v1/purchases/suppliers?limit=100'),
          fetch('/api/v1/inventory/products?limit=100'),
          fetch('/api/v1/inventory/warehouses?limit=100'),
        ]);

        const [suppliersData, productsData, warehousesData] = await Promise.all([
          suppliersRes.json(),
          productsRes.json(),
          warehousesRes.json(),
        ]);

        if (suppliersData.success) setSuppliers(suppliersData.data.suppliers);
        if (productsData.success) setProducts(productsData.data.products);
        if (warehousesData.success) setWarehouses(warehousesData.data.warehouses);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Add line
  const addLine = () => {
    const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0];
    setLines([
      ...lines,
      {
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 14,
        warehouseId: defaultWarehouse?.id || '',
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ]);
  };

  // Update line
  const updateLine = (index: number, updates: Partial<OrderLine>) => {
    const newLines = [...lines];
    const line = { ...newLines[index], ...updates };

    // Recalculate
    const subtotal = line.quantity * line.unitPrice;
    const vatAmount = subtotal * (line.taxRate / 100);
    const total = subtotal + vatAmount;

    newLines[index] = {
      ...line,
      subtotal,
      vatAmount,
      total,
    };

    setLines(newLines);
  };

  // Remove line
  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Select product
  const selectProduct = (product: Product) => {
    if (selectedLineIndex === null) return;

    const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0];
    updateLine(selectedLineIndex, {
      productId: product.id,
      description: product.nameAr,
      unitPrice: Number(product.costPrice),
      taxRate: product.vatRate,
      warehouseId: defaultWarehouse?.id || '',
    });

    setShowProductDialog(false);
    setSelectedLineIndex(null);
  };

  // Calculate totals
  const totals = lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.subtotal,
      vat: acc.vat + line.vatAmount,
      total: acc.total + line.total,
    }),
    { subtotal: 0, vat: 0, total: 0 }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Save order
  const handleSave = async () => {
    if (!supplierId) {
      alert('يرجى اختيار المورد');
      return;
    }
    if (lines.length === 0) {
      alert('يرجى إضافة بنود لأمر الشراء');
      return;
    }

    // Validate all lines have product and warehouse
    for (const line of lines) {
      if (!line.productId) {
        alert('يرجى اختيار منتج لجميع البنود');
        return;
      }
      if (!line.warehouseId) {
        alert('يرجى اختيار مخزن لجميع البنود');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          date,
          expectedDate: expectedDate || null,
          notes,
          lines: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            warehouseId: line.warehouseId,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/purchases/orders/${data.data.id}`);
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.nameAr.includes(supplierSearch) ||
      s.nameEn?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.code.includes(supplierSearch)
  );

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.nameAr.includes(productSearch) ||
      p.nameEn?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.includes(productSearch)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">أمر شراء جديد</h1>
            <p className="text-muted-foreground">إنشاء أمر شراء جديد من مورد</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Selection */}
          <Card>
            <CardHeader>
              <CardTitle>المورد</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedSupplier ? (
                      <div className="flex justify-between w-full">
                        <span>{selectedSupplier.nameAr}</span>
                        <span className="text-muted-foreground">{selectedSupplier.code}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">اختر المورد...</span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>اختيار المورد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="ps-10"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {filteredSuppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          className="w-full text-start p-3 hover:bg-accent rounded-lg transition-colors"
                          onClick={() => {
                            setSupplierId(supplier.id);
                            setShowSupplierDialog(false);
                          }}
                        >
                          <div className="font-medium">{supplier.nameAr}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.code}
                            {supplier.taxNumber && ` | ${supplier.taxNumber}`}
                          </div>
                        </button>
                      ))}
                      {filteredSuppliers.length === 0 && (
                        <p className="text-center py-4 text-muted-foreground">
                          لا يوجد موردين
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedSupplier && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">الكود:</span> {selectedSupplier.code}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرقم الضريبي:</span>{' '}
                      {selectedSupplier.taxNumber || '-'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>بنود أمر الشراء</CardTitle>
              <Button size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 me-2" />
                إضافة بند
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead className="min-w-[200px]">المنتج</TableHead>
                      <TableHead className="w-[100px]">الكمية</TableHead>
                      <TableHead className="w-[120px]">سعر الوحدة</TableHead>
                      <TableHead className="w-[100px]">الضريبة %</TableHead>
                      <TableHead className="w-[150px]">المخزن</TableHead>
                      <TableHead className="w-[120px] text-end">المجموع</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد بنود. اضغط "إضافة بند" لبدء الإضافة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Dialog
                              open={showProductDialog && selectedLineIndex === index}
                              onOpenChange={(open) => {
                                setShowProductDialog(open);
                                if (!open) setSelectedLineIndex(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <div
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedLineIndex(index);
                                    setShowProductDialog(true);
                                  }}
                                >
                                  <Input
                                    value={line.description}
                                    onChange={(e) =>
                                      updateLine(index, { description: e.target.value })
                                    }
                                    placeholder="الوصف أو اختر منتج..."
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>اختيار منتج</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="relative">
                                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="بحث..."
                                      value={productSearch}
                                      onChange={(e) => setProductSearch(e.target.value)}
                                      className="ps-10"
                                    />
                                  </div>
                                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                                    {filteredProducts.map((product) => (
                                      <button
                                        key={product.id}
                                        className="w-full text-start p-3 hover:bg-accent rounded-lg transition-colors"
                                        onClick={() => selectProduct(product)}
                                      >
                                        <div className="font-medium">{product.nameAr}</div>
                                        <div className="text-sm text-muted-foreground flex justify-between">
                                          <span>{product.sku}</span>
                                          <span>{formatCurrency(Number(product.costPrice))}</span>
                                        </div>
                                      </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                      <p className="text-center py-4 text-muted-foreground">
                                        لا توجد منتجات
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(index, { quantity: parseFloat(e.target.value) || 0 })
                              }
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateLine(index, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="text-end"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.taxRate}
                              onChange={(e) =>
                                updateLine(index, { taxRate: parseFloat(e.target.value) || 0 })
                              }
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.warehouseId}
                              onValueChange={(value) => updateLine(index, { warehouseId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="المخزن" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((wh) => (
                                  <SelectItem key={wh.id} value={wh.id}>
                                    {wh.nameAr}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-end font-medium">
                            {formatCurrency(line.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {lines.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={6} className="text-end font-medium">
                          المجموع الفرعي:
                        </TableCell>
                        <TableCell className="text-end font-medium">
                          {formatCurrency(totals.subtotal)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="text-end font-medium">
                          الضريبة:
                        </TableCell>
                        <TableCell className="text-end font-medium">
                          {formatCurrency(totals.vat)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="text-end font-bold text-lg">
                          الإجمالي:
                        </TableCell>
                        <TableCell className="text-end font-bold text-lg">
                          {formatCurrency(totals.total)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>تاريخ الأمر</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>تاريخ الاستلام المتوقع (اختياري)</Label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة:</span>
                <span className="font-medium">{formatCurrency(totals.vat)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>الإجمالي:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
