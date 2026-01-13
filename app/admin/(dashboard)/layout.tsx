'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Shield,
  Activity,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const sidebarItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/tenants', icon: Building2, label: 'الشركات' },
  { href: '/admin/users', icon: Users, label: 'مديري النظام' },
  { href: '/admin/subscriptions', icon: DollarSign, label: 'الاشتراكات' },
  { href: '/admin/reports', icon: FileText, label: 'التقارير' },
  { href: '/admin/activity', icon: Activity, label: 'سجل النشاطات' },
  { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(session));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    router.push('/admin/login');
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-slate-800 border-e border-slate-700 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-700">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-white">ERP Admin</h1>
            <p className="text-xs text-slate-400">لوحة التحكم</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 me-3" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'ms-64' : 'ms-0'}`}>
        {/* Header */}
        <header className="h-16 bg-slate-800/50 backdrop-blur border-b border-slate-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="بحث..."
                className="w-64 ps-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-300">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {admin.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{admin.name}</p>
                <p className="text-xs text-slate-400">{admin.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
