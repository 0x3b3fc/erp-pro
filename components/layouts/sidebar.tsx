'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
  UserCircle,
  BarChart3,
  Settings,
  ChevronDown,
  Receipt,
  Calculator,
  Building2,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: { title: string; href: string }[];
}

export function Sidebar() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const navItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: t('accounts'),
      href: `/${locale}/accounts`,
      icon: <Calculator className="h-5 w-5" />,
      children: [
        { title: t('chartOfAccounts'), href: `/${locale}/accounts/chart-of-accounts` },
        { title: t('journalEntries'), href: `/${locale}/accounts/journal-entries` },
      ],
    },
    {
      title: t('sales'),
      href: `/${locale}/sales`,
      icon: <Receipt className="h-5 w-5" />,
      children: [
        { title: t('invoices'), href: `/${locale}/sales/invoices` },
        { title: t('quotations'), href: `/${locale}/sales/quotations` },
        { title: t('customers'), href: `/${locale}/sales/customers` },
        { title: t('receipts'), href: `/${locale}/sales/receipts` },
      ],
    },
    {
      title: t('purchases'),
      href: `/${locale}/purchases`,
      icon: <ShoppingCart className="h-5 w-5" />,
      children: [
        { title: t('bills'), href: `/${locale}/purchases/bills` },
        { title: t('suppliers'), href: `/${locale}/purchases/suppliers` },
        { title: t('purchaseOrders'), href: `/${locale}/purchases/orders` },
      ],
    },
    {
      title: t('inventory'),
      href: `/${locale}/inventory`,
      icon: <Package className="h-5 w-5" />,
      children: [
        { title: t('products'), href: `/${locale}/inventory/products` },
        { title: t('categories'), href: `/${locale}/inventory/categories` },
        { title: t('warehouses'), href: `/${locale}/inventory/warehouses` },
        { title: t('stockMovements'), href: `/${locale}/inventory/movements` },
      ],
    },
    {
      title: t('pos'),
      href: `/${locale}/pos`,
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: t('hr'),
      href: `/${locale}/hr`,
      icon: <UserCircle className="h-5 w-5" />,
      children: [
        { title: t('employees'), href: `/${locale}/hr/employees` },
        { title: t('departments'), href: `/${locale}/hr/departments` },
        { title: t('payroll'), href: `/${locale}/hr/payroll` },
        { title: t('attendance'), href: `/${locale}/hr/attendance` },
      ],
    },
    {
      title: t('reports'),
      href: `/${locale}/reports`,
      icon: <BarChart3 className="h-5 w-5" />,
      children: [
        { title: t('trialBalance'), href: `/${locale}/reports/trial-balance` },
        { title: t('incomeStatement'), href: `/${locale}/reports/income-statement` },
        { title: t('balanceSheet'), href: `/${locale}/reports/balance-sheet` },
        { title: t('cashFlow'), href: `/${locale}/reports/cash-flow` },
        { title: t('aging'), href: `/${locale}/reports/aging` },
        { title: t('inventoryMovement'), href: `/${locale}/reports/inventory-movement` },
      ],
    },
    {
      title: t('settings'),
      href: `/${locale}/settings`,
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="fixed inset-y-0 start-0 z-50 hidden w-64 flex-col bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 md:flex shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">ERP</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 -mt-1">
              {locale === 'ar' ? 'نظام إدارة الأعمال' : 'Business Management'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        'p-1.5 rounded-lg',
                        isActive(item.href)
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      )}>
                        {item.icon}
                      </span>
                      {item.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        openMenus.includes(item.title) && 'rotate-180'
                      )}
                    />
                  </button>
                  <div className={cn(
                    'overflow-hidden transition-all duration-200',
                    openMenus.includes(item.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    <ul className="mt-1 space-y-0.5 ps-11">
                      {item.children.map((child) => (
                        <li key={child.title}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block rounded-lg px-3 py-2 text-sm transition-all duration-200',
                              isActive(child.href)
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn(
                    'p-1.5 rounded-lg',
                    isActive(item.href)
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}>
                    {item.icon}
                  </span>
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {locale === 'ar' ? 'نظام ERP المصري' : 'Egyptian ERP System'}
          </p>
        </div>
      </div>
    </aside>
  );
}
