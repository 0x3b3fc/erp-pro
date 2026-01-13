'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Plus, Trash2, Calculator, Save } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: string;
  isHeader: boolean;
}

interface CostCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

interface JournalLine {
  id: string;
  accountId: string;
  account: Account | null;
  debit: number;
  credit: number;
  description: string;
  costCenterId: string | null;
}

export default function NewJournalEntryPage() {
  const t = useTranslations();
  const router = useRouter();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
  });

  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountId: '', account: null, debit: 0, credit: 0, description: '', costCenterId: null },
    { id: '2', accountId: '', account: null, debit: 0, credit: 0, description: '', costCenterId: null },
  ]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Account search dialog
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);

  // Fetch accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounts/chart-of-accounts?limit=500');
      const data = await res.json();
      if (data.data?.accounts) {
        // Only non-header accounts
        const nonHeaderAccounts = data.data.accounts.filter((a: Account) => !a.isHeader);
        setAccounts(nonHeaderAccounts);
        setFilteredAccounts(nonHeaderAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cost centers
  const fetchCostCenters = async () => {
    try {
      const res = await fetch('/api/v1/accounts/cost-centers?limit=100');
      const data = await res.json();
      if (data.data?.costCenters) {
        setCostCenters(data.data.costCenters);
      }
    } catch (error) {
      console.error('Error fetching cost centers:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCostCenters();
  }, []);

  useEffect(() => {
    if (accountSearch) {
      const search = accountSearch.toLowerCase();
      setFilteredAccounts(
        accounts.filter(
          (a) =>
            a.code.toLowerCase().includes(search) ||
            a.nameAr.toLowerCase().includes(search) ||
            a.nameEn.toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredAccounts(accounts);
    }
  }, [accountSearch, accounts]);

  const openAccountDialog = (lineId: string) => {
    setSelectedLineId(lineId);
    setAccountSearch('');
    setShowAccountDialog(true);
  };

  const selectAccount = (account: Account) => {
    if (selectedLineId) {
      setLines(
        lines.map((line) =>
          line.id === selectedLineId
            ? { ...line, accountId: account.id, account }
            : line
        )
      );
    }
    setShowAccountDialog(false);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        accountId: '',
        account: null,
        debit: 0,
        credit: 0,
        description: '',
        costCenterId: null,
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(
      lines.map((line) => {
        if (line.id !== id) return line;

        // If entering debit, clear credit and vice versa
        if (field === 'debit' && value > 0) {
          return { ...line, debit: value, credit: 0 };
        }
        if (field === 'credit' && value > 0) {
          return { ...line, credit: value, debit: 0 };
        }

        return { ...line, [field]: value };
      })
    );
  };

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.description.trim()) {
      alert('الوصف مطلوب');
      return;
    }

    const validLines = lines.filter(
      (line) => line.accountId && (line.debit > 0 || line.credit > 0)
    );

    if (validLines.length < 2) {
      alert('يجب إدخال سطرين على الأقل');
      return;
    }

    if (!isBalanced) {
      alert('مجموع المدين يجب أن يساوي مجموع الدائن');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/accounts/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          reference: formData.reference || undefined,
          description: formData.description,
          lines: validLines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || undefined,
            costCenterId: line.costCenterId,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/accounts/journal-entries');
      } else {
        alert(data.error || t('errors.serverError'));
      }
    } catch (error) {
      alert(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">قيد يومية جديد</h1>
          <p className="text-muted-foreground">إنشاء قيد محاسبي جديد</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Details */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold">بيانات القيد</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">المرجع</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="رقم مستند / فاتورة"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="وصف القيد"
                required
              />
            </div>
          </div>
        </div>

        {/* Journal Lines */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">سطور القيد</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 me-2" />
              إضافة سطر
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">الحساب</TableHead>
                  <TableHead className="w-[150px]">مدين</TableHead>
                  <TableHead className="w-[150px]">دائن</TableHead>
                  <TableHead>البيان</TableHead>
                  {costCenters.length > 0 && (
                    <TableHead className="w-[150px]">مركز التكلفة</TableHead>
                  )}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto py-2"
                        onClick={() => openAccountDialog(line.id)}
                      >
                        {line.account ? (
                          <div className="text-start">
                            <div className="font-mono text-sm">
                              {line.account.code}
                            </div>
                            <div className="text-sm">{line.account.nameAr}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            اختر حساب...
                          </span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit || ''}
                        onChange={(e) =>
                          updateLine(
                            line.id,
                            'debit',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="font-mono text-end"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit || ''}
                        onChange={(e) =>
                          updateLine(
                            line.id,
                            'credit',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="font-mono text-end"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, 'description', e.target.value)
                        }
                        placeholder="بيان السطر"
                      />
                    </TableCell>
                    {costCenters.length > 0 && (
                      <TableCell>
                        <Select
                          value={line.costCenterId || ''}
                          onValueChange={(v) =>
                            updateLine(line.id, 'costCenterId', v || null)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            {costCenters.map((cc) => (
                              <SelectItem key={cc.id} value={cc.id}>
                                {cc.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">الإجمالي</TableCell>
                  <TableCell className="font-mono text-end font-semibold">
                    {formatCurrency(totalDebit)}
                  </TableCell>
                  <TableCell className="font-mono text-end font-semibold">
                    {formatCurrency(totalCredit)}
                  </TableCell>
                  <TableCell colSpan={costCenters.length > 0 ? 3 : 2}>
                    {isBalanced ? (
                      <Badge variant="default" className="gap-1">
                        <Calculator className="h-3 w-3" />
                        متوازن
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <Calculator className="h-3 w-3" />
                        الفرق: {formatCurrency(difference)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={submitting || !isBalanced}>
            <Save className="h-4 w-4 me-2" />
            {submitting ? 'جاري الحفظ...' : 'حفظ القيد'}
          </Button>
        </div>
      </form>

      {/* Account Selection Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>اختيار حساب</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="بحث بالكود أو الاسم..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              autoFocus
            />

            <div className="border rounded-lg overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">الكود</TableHead>
                    <TableHead>اسم الحساب</TableHead>
                    <TableHead className="w-[100px]">النوع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        لا توجد نتائج
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.slice(0, 50).map((account) => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => selectAccount(account)}
                      >
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell>
                          <div>{account.nameAr}</div>
                          <div className="text-sm text-muted-foreground">
                            {account.nameEn}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {account.accountType === 'ASSET' && 'أصول'}
                            {account.accountType === 'LIABILITY' && 'خصوم'}
                            {account.accountType === 'EQUITY' && 'ملكية'}
                            {account.accountType === 'REVENUE' && 'إيرادات'}
                            {account.accountType === 'EXPENSE' && 'مصروفات'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
