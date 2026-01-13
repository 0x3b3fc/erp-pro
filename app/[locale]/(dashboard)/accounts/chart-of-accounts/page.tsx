'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId: string | null;
  isHeader: boolean;
  level: number;
  balance: string;
  isActive: boolean;
  isSystemAccount: boolean;
  children?: Account[];
  _count?: {
    children: number;
    journalLines: number;
  };
}

const accountTypeLabels: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'خصوم',
  EQUITY: 'حقوق الملكية',
  REVENUE: 'إيرادات',
  EXPENSE: 'مصروفات',
};

const accountTypeColors: Record<string, string> = {
  ASSET: 'default',
  LIABILITY: 'secondary',
  EQUITY: 'default',
  REVENUE: 'default',
  EXPENSE: 'destructive',
};

const accountTypeIcons: Record<string, typeof Building2> = {
  ASSET: Building2,
  LIABILITY: Wallet,
  EQUITY: PiggyBank,
  REVENUE: TrendingUp,
  EXPENSE: TrendingDown,
};

export default function ChartOfAccountsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    accountType: 'ASSET' as Account['accountType'],
    parentId: '' as string | null,
    isHeader: false,
    isActive: true,
  });
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (viewMode === 'tree') {
        params.set('tree', 'true');
      } else {
        params.set('limit', '100');
        if (typeFilter && typeFilter !== 'all') {
          params.set('type', typeFilter);
        }
        if (search) {
          params.set('search', search);
        }
      }

      const res = await fetch(`/api/v1/accounts/chart-of-accounts?${params}`);
      const data = await res.json();

      if (data.data) {
        if (viewMode === 'tree') {
          setAccounts(data.data);
          // Expand first level by default
          const firstLevelIds = new Set<string>(data.data.map((a: Account) => a.id));
          setExpandedIds(firstLevelIds);
        } else {
          setAccounts(data.data.accounts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentAccounts = async () => {
    try {
      const res = await fetch('/api/v1/accounts/chart-of-accounts?headersOnly=true&limit=100');
      const data = await res.json();
      if (data.data?.accounts) {
        setParentAccounts(data.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [viewMode, typeFilter]);

  useEffect(() => {
    if (showCreateDialog || editingAccount) {
      fetchParentAccounts();
    }
  }, [showCreateDialog, editingAccount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'flat') {
      fetchAccounts();
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (items: Account[]) => {
      items.forEach((item) => {
        if (item.isHeader && item.children?.length) {
          allIds.add(item.id);
          collectIds(item.children);
        }
      });
    };
    collectIds(accounts);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;

    try {
      const res = await fetch(`/api/v1/accounts/chart-of-accounts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    }
  };

  const openCreateDialog = (parentId?: string) => {
    setFormData({
      code: '',
      nameAr: '',
      nameEn: '',
      accountType: 'ASSET',
      parentId: parentId || null,
      isHeader: false,
      isActive: true,
    });
    setEditingAccount(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (account: Account) => {
    setFormData({
      code: account.code,
      nameAr: account.nameAr,
      nameEn: account.nameEn,
      accountType: account.accountType,
      parentId: account.parentId,
      isHeader: account.isHeader,
      isActive: account.isActive,
    });
    setEditingAccount(account);
    setShowCreateDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAccount
        ? `/api/v1/accounts/chart-of-accounts/${editingAccount.id}`
        : '/api/v1/accounts/chart-of-accounts';

      const res = await fetch(url, {
        method: editingAccount ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateDialog(false);
        setEditingAccount(null);
        fetchAccounts();
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(Number(amount));
  };

  // Render tree row recursively
  const renderTreeRow = (account: Account, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.has(account.id);
    const hasChildren = account.children && account.children.length > 0;
    const Icon = accountTypeIcons[account.accountType];

    return (
      <>
        <TableRow key={account.id} className={!account.isActive ? 'opacity-50' : ''}>
          <TableCell>
            <div
              className="flex items-center gap-2"
              style={{ paddingInlineStart: `${depth * 24}px` }}
            >
              {account.isHeader && hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(account.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="w-6" />
              )}
              {account.isHeader ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 text-primary" />
                )
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-mono text-sm">{account.code}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="font-medium">{account.nameAr}</div>
            <div className="text-sm text-muted-foreground">{account.nameEn}</div>
          </TableCell>
          <TableCell>
            <Badge variant={accountTypeColors[account.accountType] as any}>
              <Icon className="h-3 w-3 me-1" />
              {accountTypeLabels[account.accountType]}
            </Badge>
          </TableCell>
          <TableCell className="text-end font-mono">
            {!account.isHeader && formatCurrency(account.balance)}
          </TableCell>
          <TableCell>
            {account.isSystemAccount ? (
              <Badge variant="outline">نظامي</Badge>
            ) : account.isActive ? (
              <Badge variant="default">نشط</Badge>
            ) : (
              <Badge variant="secondary">غير نشط</Badge>
            )}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {account.isHeader && (
                  <DropdownMenuItem onClick={() => openCreateDialog(account.id)}>
                    <Plus className="h-4 w-4 me-2" />
                    إضافة حساب فرعي
                  </DropdownMenuItem>
                )}
                {!account.isSystemAccount && (
                  <>
                    <DropdownMenuItem onClick={() => openEditDialog(account)}>
                      <Pencil className="h-4 w-4 me-2" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      حذف
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isExpanded &&
          hasChildren &&
          account.children!.map((child) => renderTreeRow(child, depth + 1))}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">دليل الحسابات</h1>
          <p className="text-muted-foreground">
            إدارة شجرة الحسابات المحاسبية
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4 me-2" />
          حساب جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالكود أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
              disabled={viewMode === 'tree'}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={viewMode === 'tree'}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={typeFilter} onValueChange={setTypeFilter} disabled={viewMode === 'tree'}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="نوع الحساب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="ASSET">أصول</SelectItem>
            <SelectItem value="LIABILITY">خصوم</SelectItem>
            <SelectItem value="EQUITY">حقوق الملكية</SelectItem>
            <SelectItem value="REVENUE">إيرادات</SelectItem>
            <SelectItem value="EXPENSE">مصروفات</SelectItem>
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'tree' | 'flat')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tree">عرض شجري</SelectItem>
            <SelectItem value="flat">عرض قائمة</SelectItem>
          </SelectContent>
        </Select>

        {viewMode === 'tree' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              توسيع الكل
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              طي الكل
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">الكود</TableHead>
              <TableHead>اسم الحساب</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead className="text-end">الرصيد</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : viewMode === 'tree' ? (
              accounts.map((account) => renderTreeRow(account))
            ) : (
              accounts.map((account) => {
                const Icon = accountTypeIcons[account.accountType];
                return (
                  <TableRow key={account.id} className={!account.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {account.isHeader ? (
                          <Folder className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-mono">{account.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{account.nameAr}</div>
                      <div className="text-sm text-muted-foreground">{account.nameEn}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={accountTypeColors[account.accountType] as any}>
                        <Icon className="h-3 w-3 me-1" />
                        {accountTypeLabels[account.accountType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono">
                      {!account.isHeader && formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell>
                      {account.isSystemAccount ? (
                        <Badge variant="outline">نظامي</Badge>
                      ) : account.isActive ? (
                        <Badge variant="default">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {account.isHeader && (
                            <DropdownMenuItem onClick={() => openCreateDialog(account.id)}>
                              <Plus className="h-4 w-4 me-2" />
                              إضافة حساب فرعي
                            </DropdownMenuItem>
                          )}
                          {!account.isSystemAccount && (
                            <>
                              <DropdownMenuItem onClick={() => openEditDialog(account)}>
                                <Pencil className="h-4 w-4 me-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(account.id)}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                حذف
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'تعديل حساب' : 'حساب جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'تعديل بيانات الحساب المحاسبي'
                : 'إضافة حساب جديد لدليل الحسابات'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">كود الحساب</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="1101"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">نوع الحساب</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, accountType: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">أصول</SelectItem>
                    <SelectItem value="LIABILITY">خصوم</SelectItem>
                    <SelectItem value="EQUITY">حقوق الملكية</SelectItem>
                    <SelectItem value="REVENUE">إيرادات</SelectItem>
                    <SelectItem value="EXPENSE">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">اسم الحساب بالعربية</Label>
              <Input
                id="nameAr"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                placeholder="النقدية بالصندوق"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">اسم الحساب بالإنجليزية</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                placeholder="Cash on Hand"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">الحساب الرئيسي</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(v) =>
                  setFormData({ ...formData, parentId: v === 'none' ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون (حساب رئيسي)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون (حساب رئيسي)</SelectItem>
                  {parentAccounts.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code} - {parent.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isHeader"
                  checked={formData.isHeader}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isHeader: checked })
                  }
                />
                <Label htmlFor="isHeader">حساب رئيسي (يحتوي حسابات فرعية)</Label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">حساب نشط</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'جاري الحفظ...' : editingAccount ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
