'use server';

import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { signIn, signOut } from './index';

export async function login(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Invalid credentials' };
  }
}

export async function logout() {
  await signOut({ redirect: false });
}

export async function register(data: {
  email: string;
  password: string;
  nameAr: string;
  nameEn: string;
  companyNameAr: string;
  companyNameEn: string;
  phone: string;
}) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyNameAr,
          subdomain: data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          planType: 'STARTER',
          status: 'ACTIVE',
        },
      });

      // Create company
      await tx.company.create({
        data: {
          tenantId: tenant.id,
          nameAr: data.companyNameAr,
          nameEn: data.companyNameEn,
          taxNumber: '',
          address: '',
          phone: data.phone,
          email: data.email,
        },
      });

      // Hash password
      const passwordHash = await hash(data.password, 12);

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          passwordHash,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Create default fiscal year
      const currentYear = new Date().getFullYear();
      await tx.fiscalYear.create({
        data: {
          tenantId: tenant.id,
          name: `${currentYear}`,
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31),
        },
      });

      // Create default warehouse
      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          code: 'MAIN',
          nameAr: 'المخزن الرئيسي',
          nameEn: 'Main Warehouse',
          isDefault: true,
          isActive: true,
        },
      });

      // Create default chart of accounts
      const defaultAccounts = [
        { code: '1', nameAr: 'الأصول', nameEn: 'Assets', type: 'ASSET', isHeader: true, level: 1 },
        { code: '11', nameAr: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'ASSET', isHeader: true, level: 2 },
        { code: '111', nameAr: 'النقدية والبنوك', nameEn: 'Cash & Banks', type: 'ASSET', isHeader: false, level: 3 },
        { code: '112', nameAr: 'العملاء', nameEn: 'Accounts Receivable', type: 'ASSET', isHeader: false, level: 3 },
        { code: '113', nameAr: 'المخزون', nameEn: 'Inventory', type: 'ASSET', isHeader: false, level: 3 },
        { code: '2', nameAr: 'الالتزامات', nameEn: 'Liabilities', type: 'LIABILITY', isHeader: true, level: 1 },
        { code: '21', nameAr: 'الالتزامات المتداولة', nameEn: 'Current Liabilities', type: 'LIABILITY', isHeader: true, level: 2 },
        { code: '211', nameAr: 'الموردين', nameEn: 'Accounts Payable', type: 'LIABILITY', isHeader: false, level: 3 },
        { code: '212', nameAr: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable', type: 'LIABILITY', isHeader: false, level: 3 },
        { code: '3', nameAr: 'حقوق الملكية', nameEn: 'Equity', type: 'EQUITY', isHeader: true, level: 1 },
        { code: '31', nameAr: 'رأس المال', nameEn: 'Capital', type: 'EQUITY', isHeader: false, level: 2 },
        { code: '32', nameAr: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'EQUITY', isHeader: false, level: 2 },
        { code: '4', nameAr: 'الإيرادات', nameEn: 'Revenue', type: 'REVENUE', isHeader: true, level: 1 },
        { code: '41', nameAr: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'REVENUE', isHeader: false, level: 2 },
        { code: '5', nameAr: 'المصروفات', nameEn: 'Expenses', type: 'EXPENSE', isHeader: true, level: 1 },
        { code: '51', nameAr: 'تكلفة المبيعات', nameEn: 'Cost of Sales', type: 'EXPENSE', isHeader: false, level: 2 },
        { code: '52', nameAr: 'مصروفات إدارية', nameEn: 'Admin Expenses', type: 'EXPENSE', isHeader: false, level: 2 },
        { code: '53', nameAr: 'مصروفات الرواتب', nameEn: 'Salary Expenses', type: 'EXPENSE', isHeader: false, level: 2 },
      ];

      for (const account of defaultAccounts) {
        await tx.chartOfAccount.create({
          data: {
            tenantId: tenant.id,
            code: account.code,
            nameAr: account.nameAr,
            nameEn: account.nameEn,
            accountType: account.type as any,
            isHeader: account.isHeader,
            level: account.level,
            isSystemAccount: true,
          },
        });
      }

      return { tenant, user };
    });

    return { success: true, tenantId: result.tenant.id };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}
