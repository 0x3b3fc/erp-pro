'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Save, Search, Package, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  unitOfMeasure: string;
  trackInventory: boolean;
}

interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

interface StockLevel {
  productId: string;
  warehouseId: string;
  quantity: string;
  avgCost: string;
}

export default function StockAdjustmentPage() {
  const t = useTranslations();
  const router = useRouter();

  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [newQuantity, setNewQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDialog, setShowProductDialog] = useState(false);

  // Selected product and warehouse
  const selectedProduct = products.find((p) => p.id === productId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          fetch('/api/v1/inventory/products?limit=1000&trackInventory=true'),
          fetch('/api/v1/inventory/warehouses?limit=100'),
        ]);

        const [productsData, warehousesData] = await Promise.all([
          productsRes.json(),
          warehousesRes.json(),
        ]);

        if (productsData.success) {
          // Filter only products that track inventory
          setProducts(productsData.data.products.filter((p: Product) => p.trackInventory));
        }
        if (warehousesData.success) setWarehouses(warehousesData.data.warehouses);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Load stock level when product and warehouse are selected
  useEffect(() => {
    if (productId && warehouseId) {
      const fetchStockLevel = async () => {
        try {
          const res = await fetch(
            `/api/v1/inventory/stock-levels?productId=${productId}&warehouseId=${warehouseId}`
          );
          const data = await res.json();
          if (data.success && data.data.stockLevels.length > 0) {
            const stock = data.data.stockLevels[0];
            setCurrentQuantity(Number(stock.quantity));
            setNewQuantity(Number(stock.quantity));
            setCostPrice(Number(stock.avgCost));
          } else {
            setCurrentQuantity(0);
            setNewQuantity(0);
            setCostPrice(0);
          }
        } catch (error) {
          console.error('Error fetching stock level:', error);
        }
      };
      fetchStockLevel();
    }
  }, [productId, warehouseId]);

  // Select product
  const selectProduct = (product: Product) => {
    setProductId(product.id);
    setShowProductDialog(false);
    setProductSearch('');
  };

  // Calculate difference
  const difference = newQuantity - currentQuantity;

  // Save adjustment
  const handleSave = async () => {
    if (!productId) {
      alert('يرجى اختيار المنتج');
      return;
    }
    if (!warehouseId) {
      alert('يرجى اختيار المخزن');
      return;
    }
    if (newQuantity < 0) {
      alert('الكمية الجديدة لا يمكن أن تكون سالبة');
      return;
    }
    if (difference === 0) {
      alert('الكمية الجديدة تساوي الكمية الحالية');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/inventory/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: newQuantity,
          costPrice: costPrice || 0,
          notes: notes || `تعديل مخزون: ${currentQuantity} → ${newQuantity}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('تم تعديل المخزون بنجاح');
        router.push('/inventory/movements');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.nameAr.includes(productSearch) ||
      p.nameEn?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.includes(productSearch)
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل المخزون</h1>
            <p className="text-muted-foreground">تعديل كمية المخزون يدوياً</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !productId || !warehouseId}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ التعديل'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات التعديل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Selection */}
          <div>
            <Label>المنتج *</Label>
            <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-1">
                  {selectedProduct ? (
                    <div className="flex justify-between w-full items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <div className="text-start">
                          <div className="font-medium">{selectedProduct.nameAr}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {selectedProduct.sku}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">اختر المنتج...</span>
                  )}
                </Button>
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
                        <div className="text-sm text-muted-foreground font-mono">
                          {product.sku}
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
          </div>

          {/* Warehouse Selection */}
          <div>
            <Label>المخزن *</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId} className="mt-1">
              <SelectTrigger>
                <SelectValue placeholder="اختر المخزن..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.nameAr} ({wh.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stock Info */}
          {productId && warehouseId && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المخزون الحالي:</span>
                <span className="font-medium">
                  {currentQuantity} {selectedProduct?.unitOfMeasure || ''}
                </span>
              </div>
              {costPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">متوسط التكلفة:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('ar-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(costPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* New Quantity */}
          <div>
            <Label htmlFor="newQuantity">الكمية الجديدة *</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              step="0.01"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            {selectedProduct && (
              <p className="text-sm text-muted-foreground mt-1">
                الوحدة: {selectedProduct.unitOfMeasure}
              </p>
            )}
          </div>

          {/* Difference */}
          {difference !== 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">الفرق:</span>
                <span className={`font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}
                  {difference} {selectedProduct?.unitOfMeasure || ''}
                </span>
              </div>
            </div>
          )}

          {/* Cost Price (optional) */}
          <div>
            <Label htmlFor="costPrice">سعر التكلفة (اختياري)</Label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="mt-1"
              placeholder="يستخدم لحساب متوسط التكلفة"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="ملاحظات حول التعديل (اختياري)"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
