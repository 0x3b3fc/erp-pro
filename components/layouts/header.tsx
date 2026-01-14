'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Bell,
  Search,
  User,
  Moon,
  Sun,
  Globe,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  Monitor,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const toggleLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}/login` });
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
      </Button>

      {/* Search */}
      <div className="hidden md:flex md:flex-1 md:max-w-md">
        <div className="relative w-full">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder={t('common.search')}
            className="ps-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLocale}
          title={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
        >
          <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Theme toggle dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : theme === 'light' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Monitor className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DropdownMenuLabel className="text-slate-500 dark:text-slate-400 text-xs">
              {locale === 'ar' ? 'المظهر' : 'Theme'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className={cn(
                "cursor-pointer",
                theme === 'light' && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              )}
            >
              <Sun className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'فاتح' : 'Light'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className={cn(
                "cursor-pointer",
                theme === 'dark' && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              )}
            >
              <Moon className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'داكن' : 'Dark'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className={cn(
                "cursor-pointer",
                theme === 'system' && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              )}
            >
              <Monitor className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'النظام' : 'System'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-[10px] text-white font-bold shadow-lg shadow-red-500/30">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-start">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                  {session?.user?.name || (locale === 'ar' ? 'المستخدم' : 'User')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {session?.user?.role === 'ADMIN'
                    ? (locale === 'ar' ? 'مسؤول' : 'Admin')
                    : (locale === 'ar' ? 'مستخدم' : 'User')}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/settings`)}
              className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'الإعدادات' : 'Settings'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
