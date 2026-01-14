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
      href: `/${locale}`,
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
    <aside className="fixed inset-y-0 start-0 z-50 hidden w-64 flex-col border-e bg-card md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">ERP</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive(item.href) && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openMenus.includes(item.title) && 'rotate-180'
                      )}
                    />
                  </button>
                  {openMenus.includes(item.title) && (
                    <ul className="mt-1 space-y-1 ps-9">
                      {item.children.map((child) => (
                        <li key={child.title}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                              isActive(child.href) &&
                              'bg-primary/10 text-primary font-medium'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive(item.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          {locale === 'ar' ? 'نظام ERP المصري' : 'Egyptian ERP System'}
        </p>
      </div>
    </aside>
  );
}
