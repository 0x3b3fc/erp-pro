import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام ERP | Egyptian ERP System',
  description:
    'نظام محاسبة متكامل للشركات المصرية - Integrated accounting system for Egyptian businesses',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
