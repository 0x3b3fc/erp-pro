import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    nameEn?: string;
    role: string;
    tenantId: string;
    tenantName: string;
    companyName: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    nameEn?: string;
    role: string;
    tenantId: string;
    tenantName: string;
    companyName: string;
  }
}
