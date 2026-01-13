'use server';

import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

const IMPERSONATION_COOKIE = 'erp_impersonation';

// Admin login
export async function adminLogin(email: string, password: string) {
  try {
    const { compare } = await import('bcryptjs');
    const normalizedEmail = email.trim().toLowerCase();

    const admin = await prisma.systemAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !admin.isActive) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isPasswordValid = await compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    await prisma.systemAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Start impersonation session
export async function startImpersonation(
  adminId: string,
  tenantId: string,
  userId?: string
) {
  try {
    // Verify admin exists and is active
    const admin = await prisma.systemAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.isActive) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        company: true,
        users: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    // Get user to impersonate (specific or first active user)
    let targetUserId = userId;
    if (!targetUserId && tenant.users.length > 0) {
      targetUserId = tenant.users[0].id;
    }

    // Create impersonation session
    const session = await prisma.impersonationSession.create({
      data: {
        adminId,
        tenantId,
        userId: targetUserId,
        ipAddress: '', // TODO: Get from request
      },
    });

    // Set impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify({
      sessionId: session.id,
      adminId,
      tenantId,
      userId: targetUserId,
      tenantName: tenant.name,
      companyName: tenant.company?.nameAr || tenant.name,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return {
      success: true,
      session: {
        id: session.id,
        tenantId,
        tenantName: tenant.name,
        companyName: tenant.company?.nameAr || tenant.name,
      }
    };
  } catch (error) {
    console.error('Start impersonation error:', error);
    return { success: false, error: 'Failed to start impersonation' };
  }
}

// End impersonation session
export async function endImpersonation(sessionId: string) {
  try {
    // Update session end time
    await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    // Clear cookie
    const cookieStore = await cookies();
    cookieStore.delete(IMPERSONATION_COOKIE);

    return { success: true };
  } catch (error) {
    console.error('End impersonation error:', error);
    return { success: false, error: 'Failed to end impersonation' };
  }
}

// Get current impersonation session
export async function getImpersonationSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!cookie?.value) {
      return null;
    }

    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

// Create first super admin (for setup)
export async function createSuperAdmin(data: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    // Check if any admin exists
    const existingAdmin = await prisma.systemAdmin.findFirst();
    if (existingAdmin) {
      return { success: false, error: 'Super admin already exists' };
    }

    const passwordHash = await hash(data.password, 12);

    const admin = await prisma.systemAdmin.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: data.name,
        role: 'SUPER_ADMIN',
      },
    });

    return {
      success: true,
      adminId: admin.id
    };
  } catch (error) {
    console.error('Create super admin error:', error);
    return { success: false, error: 'Failed to create super admin' };
  }
}

// Get all tenants for admin dashboard
export async function getAllTenants(page = 1, limit = 20, search?: string) {
  try {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          company: {
            select: { nameAr: true, nameEn: true, phone: true, email: true },
          },
          _count: {
            select: { users: true, invoices: true, customers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Get tenants error:', error);
    return { success: false, error: 'Failed to fetch tenants' };
  }
}

// Get all system admins
export async function getSystemAdmins(page = 1, limit = 20, search?: string) {
  try {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.systemAdmin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.systemAdmin.count({ where }),
    ]);

    return {
      success: true,
      data: {
        admins,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Get system admins error:', error);
    return { success: false, error: 'Failed to fetch system admins' };
  }
}

// Get tenant stats
export async function getTenantStats(tenantId: string) {
  try {
    const [
      usersCount,
      customersCount,
      invoicesCount,
      invoicesTotal,
      productsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { tenantId } }),
    ]);

    return {
      success: true,
      data: {
        users: usersCount,
        customers: customersCount,
        invoices: invoicesCount,
        invoicesTotal: invoicesTotal._sum.total || 0,
        products: productsCount,
      },
    };
  } catch (error) {
    console.error('Get tenant stats error:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// Get system-wide stats
export async function getSystemStats() {
  try {
    const [
      tenantsCount,
      activeTenantsCount,
      usersCount,
      invoicesCount,
      invoicesTotal,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ _sum: { total: true } }),
    ]);

    // Tenants by plan
    const tenantsByPlan = await prisma.tenant.groupBy({
      by: ['planType'],
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        tenants: tenantsCount,
        activeTenantsCount,
        users: usersCount,
        invoices: invoicesCount,
        invoicesTotal: invoicesTotal._sum.total || 0,
        tenantsByPlan: tenantsByPlan.map(p => ({
          plan: p.planType,
          count: p._count.id,
        })),
      },
    };
  } catch (error) {
    console.error('Get system stats error:', error);
    return { success: false, error: 'Failed to fetch system stats' };
  }
}
