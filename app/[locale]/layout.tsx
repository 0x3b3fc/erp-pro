import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cairo, Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { locales, type Locale, getDirection } from '@/lib/i18n/config';
import { cn } from '@/lib/utils/cn';
import { SessionProvider } from '@/components/providers/session-provider';
import { UnregisterServiceWorker } from '@/components/scripts/unregister-sw';

// Arabic font
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

// English font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = getDirection(locale as Locale);
  const isRTL = direction === 'rtl';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background antialiased',
          isRTL ? cairo.variable : inter.variable,
          isRTL ? 'font-cairo' : 'font-inter'
        )}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <UnregisterServiceWorker />
            <NextIntlClientProvider messages={messages}>
              {children}
              <Toaster
                position={isRTL ? 'top-left' : 'top-right'}
                richColors
                closeButton
              />
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
