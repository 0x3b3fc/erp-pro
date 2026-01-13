'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, X, Building2 } from 'lucide-react';
import { getImpersonationSession, endImpersonation } from '@/lib/auth/admin-actions';
import { toast } from 'sonner';

type ImpersonationData = {
  sessionId: string;
  adminId: string;
  tenantId: string;
  tenantName: string;
  companyName: string;
};

export function ImpersonationBar() {
  const router = useRouter();
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    const checkImpersonation = async () => {
      const session = await getImpersonationSession();
      setImpersonation(session);
    };
    checkImpersonation();
  }, []);

  const handleEndImpersonation = async () => {
    if (!impersonation) return;

    const result = await endImpersonation(impersonation.sessionId);
    if (result.success) {
      toast.success('تم إنهاء جلسة المحاكاة');
      router.push('/admin/tenants');
    } else {
      toast.error('فشل إنهاء الجلسة');
    }
  };

  if (!impersonation) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <span className="font-medium">وضع المحاكاة:</span>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{impersonation.companyName}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-950 hover:bg-amber-600"
          onClick={handleEndImpersonation}
        >
          <X className="h-4 w-4 me-1" />
          إنهاء المحاكاة
        </Button>
      </div>
    </div>
  );
}
