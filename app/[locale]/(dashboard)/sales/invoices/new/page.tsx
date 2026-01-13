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

interface Customer {
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
  salePrice: string;
  vatRate: number;
  etaCode: string | null;
}

interface InvoiceLine {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  etaCode?: string;
  // Calculated
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
}

export default function NewInvoicePage() {
  const t = useTranslations();
  const router = useRouter();

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Load customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/v1/sales/customers?limit=100');
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data.customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/v1/inventory/products?limit=100');
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Calculate line totals
  const calculateLine = (line: Partial<InvoiceLine>): InvoiceLine => {
    const quantity = line.quantity || 0;
    const unitPrice = line.unitPrice || 0;
    const discountPercent = line.discountPercent || 0;
    const vatRate = line.vatRate ?? 14;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (vatRate / 100);
    const total = afterDiscount + vatAmount;

    return {
      productId: line.productId,
      description: line.description || '',
      quantity,
      unitPrice,
      discountPercent,
      vatRate,
      etaCode: line.etaCode,
      subtotal,
      discountAmount,
      vatAmount,
      total,
    };
  };

  // Add empty line
  const addLine = () => {
    setLines([
      ...lines,
      calculateLine({
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        vatRate: 14,
      }),
    ]);
  };

  // Update line
  const updateLine = (index: number, updates: Partial<InvoiceLine>) => {
    const newLines = [...lines];
    newLines[index] = calculateLine({ ...newLines[index], ...updates });
    setLines(newLines);
  };

  // Remove line
  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Add product to line
  const selectProduct = (product: Product) => {
    if (selectedLineIndex !== null) {
      updateLine(selectedLineIndex, {
        productId: product.id,
        description: product.nameAr,
        unitPrice: Number(product.salePrice),
        vatRate: product.vatRate || 14,
        etaCode: product.etaCode || undefined,
      });
    }
    setShowProductDialog(false);
    setSelectedLineIndex(null);
  };

  // Calculate totals
  const totals = lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.subtotal,
      discount: acc.discount + line.discountAmount,
      vat: acc.vat + line.vatAmount,
      total: acc.total + line.total,
    }),
    { subtotal: 0, discount: 0, vat: 0, total: 0 }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Save invoice
  const handleSave = async () => {
    if (!customerId) {
      alert('يرجى اختيار العميل');
      return;
    }
    if (lines.length === 0) {
      alert('يرجى إضافة بنود للفاتورة');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/sales/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          date,
          dueDate: dueDate || date,
          notes,
          internalNotes,
          lines: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent,
            vatRate: line.vatRate,
            etaCode: line.etaCode,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/sales/invoices/${data.data.id}`);
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSaving(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.nameAr.includes(customerSearch) ||
      c.nameEn.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.code.includes(customerSearch)
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
            <h1 className="text-2xl font-bold">فاتورة مبيعات جديدة</h1>
            <p className="text-muted-foreground">إنشاء فاتورة مبيعات جديدة</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? 'جاري الحفظ...' : t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales.customer')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedCustomer ? (
                      <div className="flex justify-between w-full">
                        <span>{selectedCustomer.nameAr}</span>
                        <span className="text-muted-foreground">{selectedCustomer.code}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">اختر العميل...</span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>اختيار العميل</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="ps-10"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full text-start p-3 hover:bg-accent rounded-lg transition-colors"
                          onClick={() => {
                            setCustomerId(customer.id);
                            setShowCustomerDialog(false);
                          }}
                        >
                          <div className="font-medium">{customer.nameAr}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.code}
                            {customer.taxNumber && ` | ${customer.taxNumber}`}
                          </div>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <p className="text-center py-4 text-muted-foreground">
                          لا يوجد عملاء
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedCustomer && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">الكود:</span>{' '}
                      {selectedCustomer.code}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرقم الضريبي:</span>{' '}
                      {selectedCustomer.taxNumber || '-'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Lines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>بنود الفاتورة</CardTitle>
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
                      <TableHead className="min-w-[200px]">{t('sales.description')}</TableHead>
                      <TableHead className="w-[100px]">{t('common.quantity')}</TableHead>
                      <TableHead className="w-[120px]">{t('sales.unitPrice')}</TableHead>
                      <TableHead className="w-[100px]">{t('common.discount')} %</TableHead>
                      <TableHead className="w-[100px]">{t('common.vat')} %</TableHead>
                      <TableHead className="w-[120px] text-end">{t('common.total')}</TableHead>
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
                                          <span>{formatCurrency(Number(product.salePrice))}</span>
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
                              value={line.discountPercent}
                              onChange={(e) =>
                                updateLine(index, {
                                  discountPercent: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.vatRate.toString()}
                              onValueChange={(val) =>
                                updateLine(index, { vatRate: parseFloat(val) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="14">14%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
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
                        <TableCell colSpan={6} className="text-start">
                          {t('common.subtotal')}
                        </TableCell>
                        <TableCell className="text-end">{formatCurrency(totals.subtotal)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="text-start">
                          {t('common.discount')}
                        </TableCell>
                        <TableCell className="text-end text-destructive">
                          -{formatCurrency(totals.discount)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="text-start">
                          {t('common.vat')} (14%)
                        </TableCell>
                        <TableCell className="text-end">{formatCurrency(totals.vat)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-muted">
                        <TableCell colSpan={6} className="text-start font-bold text-lg">
                          {t('common.total')}
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
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>التواريخ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('sales.invoiceDate')}</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('sales.dueDate')}</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales.notes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ملاحظات للعميل</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات ستظهر على الفاتورة..."
                  rows={3}
                />
              </div>
              <div>
                <Label>{t('sales.internalNotes')}</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="ملاحظات داخلية..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الفاتورة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.subtotal')}</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.discount')}</span>
                  <span className="text-destructive">-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.vat')}</span>
                  <span>{formatCurrency(totals.vat)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>{t('common.total')}</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
