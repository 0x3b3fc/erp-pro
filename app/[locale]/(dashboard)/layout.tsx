import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';
import { ImpersonationBar } from '@/components/layouts/impersonation-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ImpersonationBar />
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col md:ms-64">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
