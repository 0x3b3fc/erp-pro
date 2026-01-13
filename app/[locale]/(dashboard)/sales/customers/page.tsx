'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Customer = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  taxNumber: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  city: string | null;
  creditLimit: number;
  isActive: boolean;
  _count: {
    invoices: number;
  };
};

export default function CustomersPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === 'ar';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) {
        searchParams.set('search', search);
      }

      const response = await fetch(`/api/v1/sales/customers?${searchParams}`);
      const result = await response.json();

      if (result.data) {
        setCustomers(result.data.customers);
        setPagination((prev) => ({
          ...prev,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, search]);

  const handleDelete = async () => {
    if (!deleteDialog.customer) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/v1/sales/customers/${deleteDialog.customer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('common.success'));
        setDeleteDialog({ open: false, customer: null });
        fetchCustomers();
      } else {
        const result = await response.json();
        toast.error(result.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const getName = (customer: Customer) => {
    return isRTL ? customer.nameAr : customer.nameEn;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('navigation.customers')}</h1>
          <p className="text-muted-foreground">
            {t('sales.customerName')} - {pagination.total} {t('common.total')}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/sales/customers/new`)}>
          <Plus className="h-4 w-4 me-2" />
          {t('common.create')}
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('common.search')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t('common.search')}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p>{t('common.noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sales.customerCode')}</TableHead>
                  <TableHead>{t('sales.customerName')}</TableHead>
                  <TableHead>{t('sales.taxNumber')}</TableHead>
                  <TableHead>{t('settings.phone')}</TableHead>
                  <TableHead>{t('sales.creditLimit')}</TableHead>
                  <TableHead>{t('navigation.invoices')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.code}</TableCell>
                    <TableCell>{getName(customer)}</TableCell>
                    <TableCell>{customer.taxNumber || '-'}</TableCell>
                    <TableCell>{customer.phone || customer.mobile || '-'}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                      }).format(customer.creditLimit)}
                    </TableCell>
                    <TableCell>{customer._count.invoices}</TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'success' : 'secondary'}>
                        {customer.isActive ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${locale}/sales/customers/${customer.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${locale}/sales/customers/${customer.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, customer })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.total')}: {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-3 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, customer: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription>{t('common.deleteWarning')}</DialogDescription>
          </DialogHeader>
          <p className="py-4">
            {deleteDialog.customer && getName(deleteDialog.customer)}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, customer: null })}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
