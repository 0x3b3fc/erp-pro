'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CreditCard,
    Banknote,
    QrCode,
    Receipt,
    User,
    Tag,
    Percent,
    Calculator,
    Printer,
    XCircle,
    Check,
    Package,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    image: string | null;
    stock: number;
    category: string;
    barcode: string | null;
}

interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    price: number;
    discount: number;
    total: number;
}

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    balance: number;
}

export default function POSPage() {
    const t = useTranslations();
    const locale = useLocale();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
    const [cashReceived, setCashReceived] = useState('');
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'all', name: locale === 'ar' ? 'الكل' : 'All' },
        { id: 'electronics', name: locale === 'ar' ? 'إلكترونيات' : 'Electronics' },
        { id: 'accessories', name: locale === 'ar' ? 'إكسسوارات' : 'Accessories' },
        { id: 'furniture', name: locale === 'ar' ? 'أثاث' : 'Furniture' },
        { id: 'stationery', name: locale === 'ar' ? 'مستلزمات مكتبية' : 'Stationery' },
    ];

    useEffect(() => {
        // Demo products
        setProducts([
            { id: '1', sku: 'SKU001', name: locale === 'ar' ? 'لابتوب ديل' : 'Dell Laptop', price: 15000, image: null, stock: 25, category: 'electronics', barcode: '1234567890' },
            { id: '2', sku: 'SKU002', name: locale === 'ar' ? 'شاشة سامسونج' : 'Samsung Monitor', price: 5000, image: null, stock: 40, category: 'electronics', barcode: '1234567891' },
            { id: '3', sku: 'SKU003', name: locale === 'ar' ? 'طابعة HP' : 'HP Printer', price: 3000, image: null, stock: 15, category: 'electronics', barcode: '1234567892' },
            { id: '4', sku: 'SKU004', name: locale === 'ar' ? 'ماوس لوجيتك' : 'Logitech Mouse', price: 200, image: null, stock: 100, category: 'accessories', barcode: '1234567893' },
            { id: '5', sku: 'SKU005', name: locale === 'ar' ? 'كيبورد ميكانيكي' : 'Mechanical Keyboard', price: 800, image: null, stock: 50, category: 'accessories', barcode: '1234567894' },
            { id: '6', sku: 'SKU006', name: locale === 'ar' ? 'مكتب خشبي' : 'Wooden Desk', price: 2500, image: null, stock: 10, category: 'furniture', barcode: '1234567895' },
            { id: '7', sku: 'SKU007', name: locale === 'ar' ? 'كرسي مكتب' : 'Office Chair', price: 1500, image: null, stock: 20, category: 'furniture', barcode: '1234567896' },
            { id: '8', sku: 'SKU008', name: locale === 'ar' ? 'أوراق A4' : 'A4 Paper', price: 150, image: null, stock: 200, category: 'stationery', barcode: '1234567897' },
        ]);
        setLoading(false);
        searchInputRef.current?.focus();
    }, [locale]);

    const filteredProducts = products.filter(p => {
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return p.name.toLowerCase().includes(searchLower) ||
                p.sku.toLowerCase().includes(searchLower) ||
                p.barcode?.includes(search);
        }
        return true;
    });

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            updateQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
            const newItem: CartItem = {
                id: Date.now().toString(),
                product,
                quantity: 1,
                price: product.price,
                discount: 0,
                total: product.price,
            };
            setCart([...cart, newItem]);
        }
        setSearch('');
        searchInputRef.current?.focus();
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const total = (item.price * newQuantity) - item.discount;
                return { ...item, quantity: newQuantity, total };
            }
            return item;
        }));
    };

    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
        setCustomer(null);
        setDiscount(0);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * 0.14;
    const totalDiscount = discount;
    const grandTotal = subtotal + vatAmount - totalDiscount;
    const change = parseFloat(cashReceived) - grandTotal || 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePayment = async () => {
        // Process payment
        console.log('Processing payment:', {
            items: cart,
            customer,
            paymentMethod,
            subtotal,
            vatAmount,
            discount: totalDiscount,
            total: grandTotal,
            cashReceived: parseFloat(cashReceived),
            change,
        });

        // Clear cart after successful payment
        clearCart();
        setPaymentDialog(false);
        setCashReceived('');
    };

    const handleBarcodeSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find(p => p.barcode === search);
        if (product) {
            addToCart(product);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
            {/* Products Section */}
            <div className="flex-1 flex flex-col">
                {/* Search and Categories */}
                <div className="mb-4 space-y-4">
                    <form onSubmit={handleBarcodeSearch} className="relative">
                        <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder={locale === 'ar' ? 'بحث بالباركود أو الاسم...' : 'Search by barcode or name...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-10 h-12 text-lg"
                            autoFocus
                        />
                        <QrCode className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    </form>

                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:border-primary transition-colors"
                                onClick={() => addToCart(product)}
                            >
                                <CardContent className="p-4">
                                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                                        <Package className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                                        <Badge variant={product.stock > 10 ? 'secondary' : 'destructive'}>
                                            {product.stock}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-96 flex flex-col bg-card border rounded-lg">
                {/* Cart Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            {locale === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
                        </h2>
                        {cart.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearCart}>
                                <XCircle className="h-4 w-4 me-1" />
                                {locale === 'ar' ? 'مسح' : 'Clear'}
                            </Button>
                        )}
                    </div>
                    {customer && (
                        <div className="mt-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="text-sm">{customer.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCustomer(null)}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-auto p-4 space-y-2">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>{locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} × {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-end min-w-16">
                                    <p className="font-bold">{formatCurrency(item.total)}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Summary */}
                <div className="p-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>{locale === 'ar' ? 'ضريبة القيمة المضافة (14%)' : 'VAT (14%)'}</span>
                        <span>{formatCurrency(vatAmount)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
                            <span>-{formatCurrency(totalDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                        <span className="text-primary">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>

                {/* Payment Buttons */}
                <div className="p-4 border-t space-y-2">
                    <Button
                        className="w-full h-12 text-lg"
                        disabled={cart.length === 0}
                        onClick={() => setPaymentDialog(true)}
                    >
                        <CreditCard className="me-2 h-5 w-5" />
                        {locale === 'ar' ? 'الدفع' : 'Pay'} ({formatCurrency(grandTotal)})
                    </Button>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" disabled={cart.length === 0}>
                            <User className="me-2 h-4 w-4" />
                            {locale === 'ar' ? 'عميل' : 'Customer'}
                        </Button>
                        <Button variant="outline" disabled={cart.length === 0}>
                            <Percent className="me-2 h-4 w-4" />
                            {locale === 'ar' ? 'خصم' : 'Discount'}
                        </Button>
                        <Button variant="outline">
                            <Receipt className="me-2 h-4 w-4" />
                            {locale === 'ar' ? 'معلق' : 'Hold'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{locale === 'ar' ? 'إتمام الدفع' : 'Complete Payment'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}</p>
                            <p className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('cash')}
                                className="h-20 flex-col"
                            >
                                <Banknote className="h-6 w-6 mb-1" />
                                {locale === 'ar' ? 'نقدي' : 'Cash'}
                            </Button>
                            <Button
                                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('card')}
                                className="h-20 flex-col"
                            >
                                <CreditCard className="h-6 w-6 mb-1" />
                                {locale === 'ar' ? 'بطاقة' : 'Card'}
                            </Button>
                            <Button
                                variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('credit')}
                                className="h-20 flex-col"
                                disabled={!customer}
                            >
                                <User className="h-6 w-6 mb-1" />
                                {locale === 'ar' ? 'آجل' : 'Credit'}
                            </Button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {locale === 'ar' ? 'المبلغ المستلم' : 'Cash Received'}
                                </label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    className="h-12 text-lg text-center"
                                />
                                {change > 0 && (
                                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <span className="text-sm text-muted-foreground">{locale === 'ar' ? 'الباقي: ' : 'Change: '}</span>
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(change)}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 gap-2">
                                    {[50, 100, 200, 500].map(amount => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            onClick={() => setCashReceived(amount.toString())}
                                        >
                                            {amount}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setCashReceived(Math.ceil(grandTotal).toString())}
                                >
                                    {locale === 'ar' ? 'المبلغ الصحيح' : 'Exact Amount'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialog(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={paymentMethod === 'cash' && parseFloat(cashReceived) < grandTotal}
                        >
                            <Check className="me-2 h-4 w-4" />
                            {locale === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
