'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, Package, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);

      const res = await fetch(`/api/v1/inventory/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/v1/inventory/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      EA: 'قطعة',
      KGM: 'كيلوجرام',
      MTR: 'متر',
      LTR: 'لتر',
      PR: 'زوج',
      BX: 'صندوق',
      DZ: 'دستة',
    };
    return labels[unit] || unit;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('navigation.products')}</h1>
          <p className="text-muted-foreground">إدارة المنتجات والأصناف</p>
        </div>
        <Button onClick={() => router.push('/inventory/products/new')}>
          <Plus className="h-4 w-4 me-2" />
          {t('inventory.product')} جديد
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بكود المنتج أو الاسم أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.sku')}</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>{t('inventory.category')}</TableHead>
              <TableHead>{t('inventory.unitOfMeasure')}</TableHead>
              <TableHead className="text-end">{t('inventory.salesPrice')}</TableHead>
              <TableHead className="text-center">{t('common.vat')}</TableHead>
              <TableHead className="text-center">{t('inventory.currentStock')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{product.nameAr}</div>
                        {product.nameEn && (
                          <div className="text-sm text-muted-foreground">{product.nameEn}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.nameAr || '-'}</TableCell>
                  <TableCell>{getUnitLabel(product.unitOfMeasure)}</TableCell>
                  <TableCell className="text-end font-medium">
                    {formatCurrency(product.salePrice)}
                  </TableCell>
                  <TableCell className="text-center">{product.vatRate}%</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={
                          product.reorderPoint && product.totalStock <= product.reorderPoint
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {product.totalStock}
                      </span>
                      {product.reorderPoint && product.totalStock <= product.reorderPoint && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/inventory/products/${product.id}`)}
                        >
                          <Edit className="h-4 w-4 me-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            عرض {products.length} من {pagination.total} منتج
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
