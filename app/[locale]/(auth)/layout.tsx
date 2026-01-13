'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('auth');
  const params = useParams();
  const locale = params.locale as string;
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="absolute top-0 w-full p-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
          ERP Pro
        </Link>
        <Link
          href={`/${otherLocale}/login`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {locale === 'ar' ? 'English' : 'العربية'}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ERP Pro. {t('allRightsReserved')}
      </footer>
    </div>
  );
}
