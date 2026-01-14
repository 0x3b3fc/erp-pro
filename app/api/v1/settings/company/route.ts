import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
    getAuthSession,
    unauthorizedResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
} from '@/lib/api/utils';

// GET /api/v1/settings/company - Get company settings
export async function GET() {
    try {
        const { tenantId } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        const company = await prisma.company.findUnique({
            where: { tenantId },
        });

        if (!company) {
            // Return empty defaults if no company settings yet
            return successResponse({
                nameAr: '',
                nameEn: '',
                taxNumber: '',
                commercialRegNumber: '',
                address: '',
                governorate: '',
                city: '',
                phone: '',
                email: '',
                website: '',
                logo: '',
                currency: 'EGP',
                vatRate: 14,
                etaClientId: '',
                etaClientSecret: '',
                etaEnvironment: 'PREPROD',
                etaActivityCode: '',
                etaBranchId: '',
            });
        }

        // Don't expose full ETA credentials
        return successResponse({
            nameAr: company.nameAr,
            nameEn: company.nameEn,
            taxNumber: company.taxNumber,
            commercialRegNumber: company.commercialRegNumber || '',
            address: company.address,
            governorate: company.governorate || '',
            city: company.city || '',
            phone: company.phone,
            email: company.email,
            website: company.website || '',
            logo: company.logo || '',
            currency: company.currency,
            vatRate: company.vatRate,
            // Mask ETA credentials
            etaClientId: company.etaClientId ? '••••••••' + company.etaClientId.slice(-4) : '',
            etaClientSecret: company.etaClientSecret ? '••••••••••••' : '',
            etaEnvironment: company.etaEnvironment,
            etaActivityCode: company.etaActivityCode || '',
            etaBranchId: company.etaBranchId || '',
            hasEtaCredentials: !!(company.etaClientId && company.etaClientSecret),
        });
    } catch (error) {
        console.error('Error fetching company settings:', error);
        return serverErrorResponse();
    }
}

// PUT /api/v1/settings/company - Update company settings
export async function PUT(request: Request) {
    try {
        const { tenantId } = await getAuthSession();

        if (!tenantId) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const {
            nameAr,
            nameEn,
            taxNumber,
            commercialRegNumber,
            address,
            governorate,
            city,
            phone,
            email,
            website,
            logo,
            currency,
            vatRate,
            etaClientId,
            etaClientSecret,
            etaEnvironment,
            etaActivityCode,
            etaBranchId,
        } = body;

        // Check if company exists
        const existingCompany = await prisma.company.findUnique({
            where: { tenantId },
        });

        // Build update data - only include ETA credentials if provided (not masked)
        const updateData: any = {
            nameAr,
            nameEn,
            taxNumber,
            commercialRegNumber,
            address,
            governorate,
            city,
            phone,
            email,
            website,
            logo,
            currency,
            vatRate: vatRate ? parseFloat(vatRate) : 14,
            etaEnvironment: etaEnvironment || 'PREPROD',
            etaActivityCode,
            etaBranchId,
        };

        // Only update ETA credentials if they're not masked values
        if (etaClientId && !etaClientId.startsWith('••••')) {
            updateData.etaClientId = etaClientId;
        }
        if (etaClientSecret && !etaClientSecret.startsWith('••••')) {
            updateData.etaClientSecret = etaClientSecret;
        }

        let company;
        if (existingCompany) {
            company = await prisma.company.update({
                where: { tenantId },
                data: updateData,
            });
        } else {
            company = await prisma.company.create({
                data: {
                    tenantId,
                    ...updateData,
                },
            });
        }

        return successResponse({
            message: 'تم حفظ الإعدادات بنجاح',
            company: {
                nameAr: company.nameAr,
                nameEn: company.nameEn,
                taxNumber: company.taxNumber,
                email: company.email,
            },
        });
    } catch (error) {
        console.error('Error updating company settings:', error);
        return serverErrorResponse();
    }
}
