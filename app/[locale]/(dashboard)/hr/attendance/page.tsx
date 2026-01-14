'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Calendar,
    Clock,
    LogIn,
    LogOut,
    RefreshCw,
    Download,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Timer,
    Search,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
    id: string;
    employee: {
        id: string;
        employeeNumber: string;
        nameAr: string;
        nameEn: string | null;
        department: string;
    };
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
    workHours: number | null;
    overtime: number | null;
    notes: string | null;
}

interface AttendanceStats {
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    averageWorkHours: number;
}

export default function AttendancePage() {
    const t = useTranslations();
    const locale = useLocale();

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                date: selectedDate,
            });
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/v1/hr/attendance?${params}`);
            const data = await res.json();

            if (data.success) {
                setRecords(data.data.records);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            // Demo data
            setRecords([
                {
                    id: '1',
                    employee: { id: '1', employeeNumber: 'EMP001', nameAr: 'أحمد محمد علي', nameEn: 'Ahmed Mohamed Ali', department: 'المبيعات' },
                    date: selectedDate,
                    checkIn: '08:30',
                    checkOut: '17:15',
                    status: 'present',
                    workHours: 8.75,
                    overtime: 0.75,
                    notes: null,
                },
                {
                    id: '2',
                    employee: { id: '2', employeeNumber: 'EMP002', nameAr: 'سارة أحمد', nameEn: 'Sara Ahmed', department: 'المحاسبة' },
                    date: selectedDate,
                    checkIn: '09:15',
                    checkOut: '17:00',
                    status: 'late',
                    workHours: 7.75,
                    overtime: 0,
                    notes: 'تأخر بسبب المواصلات',
                },
                {
                    id: '3',
                    employee: { id: '3', employeeNumber: 'EMP003', nameAr: 'محمد سعيد', nameEn: 'Mohamed Said', department: 'تكنولوجيا المعلومات' },
                    date: selectedDate,
                    checkIn: null,
                    checkOut: null,
                    status: 'leave',
                    workHours: null,
                    overtime: null,
                    notes: 'إجازة سنوية',
                },
                {
                    id: '4',
                    employee: { id: '4', employeeNumber: 'EMP004', nameAr: 'فاطمة حسن', nameEn: 'Fatma Hassan', department: 'الموارد البشرية' },
                    date: selectedDate,
                    checkIn: '08:00',
                    checkOut: '17:30',
                    status: 'present',
                    workHours: 9.5,
                    overtime: 1.5,
                    notes: null,
                },
                {
                    id: '5',
                    employee: { id: '5', employeeNumber: 'EMP005', nameAr: 'خالد عبدالله', nameEn: 'Khaled Abdullah', department: 'المبيعات' },
                    date: selectedDate,
                    checkIn: null,
                    checkOut: null,
                    status: 'absent',
                    workHours: null,
                    overtime: null,
                    notes: 'غياب بدون إذن',
                },
            ]);
            setStats({
                totalEmployees: 25,
                present: 18,
                absent: 2,
                late: 3,
                onLeave: 2,
                averageWorkHours: 8.2,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAttendance();
    };

    const formatTime = (time: string | null) => {
        if (!time) return '-';
        return time;
    };

    const formatHours = (hours: number | null) => {
        if (hours === null) return '-';
        return hours.toFixed(2);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            present: { label: locale === 'ar' ? 'حاضر' : 'Present', color: 'bg-green-600', icon: <CheckCircle className="h-3 w-3" /> },
            absent: { label: locale === 'ar' ? 'غائب' : 'Absent', color: 'bg-red-600', icon: <XCircle className="h-3 w-3" /> },
            late: { label: locale === 'ar' ? 'متأخر' : 'Late', color: 'bg-yellow-600', icon: <AlertCircle className="h-3 w-3" /> },
            half_day: { label: locale === 'ar' ? 'نصف يوم' : 'Half Day', color: 'bg-orange-600', icon: <Timer className="h-3 w-3" /> },
            leave: { label: locale === 'ar' ? 'إجازة' : 'On Leave', color: 'bg-blue-600', icon: <Calendar className="h-3 w-3" /> },
        };
        const config = statusConfig[status] || statusConfig.absent;
        return (
            <Badge className={`${config.color} text-white flex items-center gap-1`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const filteredRecords = records.filter(r => {
        if (search) {
            const searchLower = search.toLowerCase();
            return r.employee.nameAr.toLowerCase().includes(searchLower) ||
                r.employee.nameEn?.toLowerCase().includes(searchLower) ||
                r.employee.employeeNumber.toLowerCase().includes(searchLower);
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === 'ar' ? 'سجل الحضور والانصراف' : 'Attendance Records'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'متابعة حضور وانصراف الموظفين'
                            : 'Track employee check-in and check-out'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-[180px]"
                    />
                    <Button variant="outline" size="icon" onClick={fetchAttendance}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {locale === 'ar' ? 'إجمالي الموظفين' : 'Total Employees'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/50 cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('present')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {locale === 'ar' ? 'حاضر' : 'Present'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-500/50 cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('absent')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                {locale === 'ar' ? 'غائب' : 'Absent'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-500/50 cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('late')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                {locale === 'ar' ? 'متأخر' : 'Late'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-500/50 cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('leave')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                {locale === 'ar' ? 'في إجازة' : 'On Leave'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {locale === 'ar' ? 'متوسط ساعات العمل' : 'Avg. Work Hours'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageWorkHours.toFixed(1)}</div>
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
                                placeholder={locale === 'ar' ? 'بحث بالاسم أو رقم الموظف...' : 'Search by name or employee number...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-9"
                            />
                        </form>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'كل الحالات' : 'All Status'}</SelectItem>
                                <SelectItem value="present">{locale === 'ar' ? 'حاضر' : 'Present'}</SelectItem>
                                <SelectItem value="absent">{locale === 'ar' ? 'غائب' : 'Absent'}</SelectItem>
                                <SelectItem value="late">{locale === 'ar' ? 'متأخر' : 'Late'}</SelectItem>
                                <SelectItem value="leave">{locale === 'ar' ? 'في إجازة' : 'On Leave'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Table */}
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
                                    <TableHead>{locale === 'ar' ? 'رقم الموظف' : 'Emp. No.'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'القسم' : 'Department'}</TableHead>
                                    <TableHead className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <LogIn className="h-4 w-4" />
                                            {locale === 'ar' ? 'دخول' : 'Check In'}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <LogOut className="h-4 w-4" />
                                            {locale === 'ar' ? 'خروج' : 'Check Out'}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">{locale === 'ar' ? 'ساعات العمل' : 'Work Hours'}</TableHead>
                                    <TableHead className="text-center">{locale === 'ar' ? 'الإضافي' : 'Overtime'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'ملاحظات' : 'Notes'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لا توجد سجلات' : 'No records found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-mono">{record.employee.employeeNumber}</TableCell>
                                            <TableCell className="font-medium">
                                                {locale === 'ar' ? record.employee.nameAr : record.employee.nameEn || record.employee.nameAr}
                                            </TableCell>
                                            <TableCell>{record.employee.department}</TableCell>
                                            <TableCell className="text-center font-mono">
                                                {formatTime(record.checkIn)}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {formatTime(record.checkOut)}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {formatHours(record.workHours)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {record.overtime && record.overtime > 0 ? (
                                                    <span className="text-green-600 font-medium">+{formatHours(record.overtime)}</span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                                                {record.notes || '-'}
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
