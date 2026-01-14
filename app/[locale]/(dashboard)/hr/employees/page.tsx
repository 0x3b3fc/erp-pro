'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    Plus,
    Search,
    Users,
    Edit,
    Trash2,
    MoreHorizontal,
    Eye,
    RefreshCw,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Calendar,
    DollarSign,
    UserCheck,
    UserX,
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
} from "@/components/ui/select";

interface Employee {
    id: string;
    employeeNumber: string;
    nameAr: string;
    nameEn: string | null;
    email: string;
    phone: string | null;
    department: {
        id: string;
        nameAr: string;
        nameEn: string | null;
    } | null;
    position: string;
    hireDate: string;
    salary: number;
    status: 'active' | 'inactive' | 'on_leave' | 'terminated';
    avatar: string | null;
}

interface EmployeeStats {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
    totalSalaries: number;
}

export default function EmployeesPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState<EmployeeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (departmentFilter !== 'all') params.set('department', departmentFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/v1/hr/employees?${params}`);
            const data = await res.json();

            if (data.success) {
                setEmployees(data.data.employees);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            // Demo data
            setEmployees([
                {
                    id: '1',
                    employeeNumber: 'EMP001',
                    nameAr: 'أحمد محمد علي',
                    nameEn: 'Ahmed Mohamed Ali',
                    email: 'ahmed@company.com',
                    phone: '01001234567',
                    department: { id: '1', nameAr: 'المبيعات', nameEn: 'Sales' },
                    position: 'مدير مبيعات',
                    hireDate: '2022-01-15',
                    salary: 15000,
                    status: 'active',
                    avatar: null,
                },
                {
                    id: '2',
                    employeeNumber: 'EMP002',
                    nameAr: 'سارة أحمد',
                    nameEn: 'Sara Ahmed',
                    email: 'sara@company.com',
                    phone: '01101234567',
                    department: { id: '2', nameAr: 'المحاسبة', nameEn: 'Accounting' },
                    position: 'محاسب',
                    hireDate: '2023-03-01',
                    salary: 10000,
                    status: 'active',
                    avatar: null,
                },
                {
                    id: '3',
                    employeeNumber: 'EMP003',
                    nameAr: 'محمد سعيد',
                    nameEn: 'Mohamed Said',
                    email: 'msaid@company.com',
                    phone: '01201234567',
                    department: { id: '3', nameAr: 'تكنولوجيا المعلومات', nameEn: 'IT' },
                    position: 'مطور برمجيات',
                    hireDate: '2023-06-15',
                    salary: 12000,
                    status: 'on_leave',
                    avatar: null,
                },
                {
                    id: '4',
                    employeeNumber: 'EMP004',
                    nameAr: 'فاطمة حسن',
                    nameEn: 'Fatma Hassan',
                    email: 'fatma@company.com',
                    phone: '01501234567',
                    department: { id: '4', nameAr: 'الموارد البشرية', nameEn: 'HR' },
                    position: 'أخصائي موارد بشرية',
                    hireDate: '2021-08-01',
                    salary: 8000,
                    status: 'active',
                    avatar: null,
                },
            ]);
            setStats({
                total: 25,
                active: 22,
                onLeave: 2,
                terminated: 1,
                totalSalaries: 285000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [page, departmentFilter, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchEmployees();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG');
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            active: { label: locale === 'ar' ? 'نشط' : 'Active', variant: 'default' },
            inactive: { label: locale === 'ar' ? 'غير نشط' : 'Inactive', variant: 'secondary' },
            on_leave: { label: locale === 'ar' ? 'في إجازة' : 'On Leave', variant: 'outline' },
            terminated: { label: locale === 'ar' ? 'منتهي' : 'Terminated', variant: 'destructive' },
        };
        const config = statusConfig[status] || statusConfig.inactive;
        return (
            <Badge variant={config.variant} className={status === 'active' ? 'bg-green-600' : status === 'on_leave' ? 'bg-yellow-600' : ''}>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'الموظفين' : 'Employees'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'إدارة بيانات الموظفين والرواتب'
                            : 'Manage employee data and salaries'
                        }
                    </p>
                </div>
                <Button onClick={() => router.push(`/${locale}/hr/employees/new`)}>
                    <Plus className="me-2 h-4 w-4" />
                    {locale === 'ar' ? 'موظف جديد' : 'New Employee'}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {locale === 'ar' ? 'إجمالي الموظفين' : 'Total Employees'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                {locale === 'ar' ? 'نشط' : 'Active'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-yellow-600" />
                                {locale === 'ar' ? 'في إجازة' : 'On Leave'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <UserX className="h-4 w-4 text-red-600" />
                                {locale === 'ar' ? 'منتهي' : 'Terminated'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                {locale === 'ar' ? 'إجمالي الرواتب' : 'Total Salaries'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-primary">{formatCurrency(stats.totalSalaries)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Filter */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد أو رقم الموظف...' : 'Search by name, email or employee number...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-9"
                            />
                        </form>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Building2 className="h-4 w-4 me-2" />
                                <SelectValue placeholder={locale === 'ar' ? 'القسم' : 'Department'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                                <SelectItem value="sales">{locale === 'ar' ? 'المبيعات' : 'Sales'}</SelectItem>
                                <SelectItem value="accounting">{locale === 'ar' ? 'المحاسبة' : 'Accounting'}</SelectItem>
                                <SelectItem value="it">{locale === 'ar' ? 'تكنولوجيا المعلومات' : 'IT'}</SelectItem>
                                <SelectItem value="hr">{locale === 'ar' ? 'الموارد البشرية' : 'HR'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل الحالات' : 'All Status'}</SelectItem>
                                <SelectItem value="active">{locale === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                                <SelectItem value="on_leave">{locale === 'ar' ? 'في إجازة' : 'On Leave'}</SelectItem>
                                <SelectItem value="terminated">{locale === 'ar' ? 'منتهي' : 'Terminated'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchEmployees}>
                            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                            {locale === 'ar' ? 'تحديث' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{locale === 'ar' ? 'رقم الموظف' : 'Employee No.'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'القسم' : 'Department'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'المسمى الوظيفي' : 'Position'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الراتب' : 'Salary'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لا يوجد موظفين' : 'No employees found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-mono font-medium">{employee.employeeNumber}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {locale === 'ar' ? employee.nameAr : employee.nameEn || employee.nameAr}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {employee.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {employee.department ? (
                                                    locale === 'ar' ? employee.department.nameAr : employee.department.nameEn || employee.department.nameAr
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{employee.position}</TableCell>
                                            <TableCell>{formatDate(employee.hireDate)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(employee.salary)}</TableCell>
                                            <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/${locale}/hr/employees/${employee.id}`)}>
                                                            <Eye className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'عرض' : 'View'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/${locale}/hr/employees/${employee.id}/edit`)}>
                                                            <Edit className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="me-2 h-4 w-4" />
                                                            {locale === 'ar' ? 'حذف' : 'Delete'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
