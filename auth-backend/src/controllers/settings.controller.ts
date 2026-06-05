import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { encrypt, decrypt } from '../utils/crypto';

const prisma = new PrismaClient();

// Default values used as fallback when DB has no data yet
const DEFAULTS: Record<string, string> = {
    'general.siteName': 'منصة دال',
    'general.siteDescription': 'منصة شاملة لحجز وإدارة الدورات التدريبية',
    'general.contactEmail': 'support@platform.com',
    'general.supportPhone': '',
    'general.maintenanceMode': 'false',
    'general.registrationEnabled': 'true',
    'email.fromName': process.env.SMTP_FROM?.split('<')[0]?.trim() || 'منصة دال',
    'email.fromEmail': process.env.SMTP_FROM?.match(/<(.*)>/)?.[1] || process.env.SMTP_FROM || '',
    'email.smtpHost': process.env.SMTP_HOST || '',
    'email.smtpPort': process.env.SMTP_PORT || '587',
    'email.smtpUser': process.env.SMTP_USER || '',
    'email.smtpPassword': process.env.SMTP_PASS || '',
    'legal.termsContent': '',
    'legal.termsUpdatedAt': '',
    'legal.privacyContent': '',
    'legal.privacyUpdatedAt': '',
};

/**
 * Convert flat DB rows into nested settings object
 */
function rowsToSettings(rows: { key: string; value: string }[]): Record<string, any> {
    const map: Record<string, string> = {};
    // Start with defaults
    Object.assign(map, DEFAULTS);
    // Override with DB values
    for (const row of rows) {
        map[row.key] = row.value;
    }

    // Group by prefix
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(map)) {
        const [section, field] = key.split('.');
        if (!result[section]) result[section] = {};
        result[section][field] = value;
    }
    return result;
}

export const settingsController = {
    /**
     * GET /api/admin/settings
     * Returns all settings grouped by section (admin only)
     */
    getSettings: async (req: AuthRequest, res: Response, _next: NextFunction) => {
        try {
            if (req.user?.role !== 'PLATFORM_ADMIN') {
                return sendError(res, 'غير مصرح لك بالوصول', 403);
            }

            const rows = await prisma.systemSetting.findMany();
            const settings = rowsToSettings(rows);

            if (settings.email && settings.email.smtpPassword) {
                settings.email.smtpPassword = decrypt(settings.email.smtpPassword);
            }

            return sendSuccess(res, 'تم جلب الإعدادات بنجاح', settings);
        } catch (error: any) {
            return sendError(res, error.message, 500);
        }
    },

    /**
     * PUT /api/admin/settings
     * Upserts a batch of settings (admin only)
     * Body: { key: string, value: string }[]
     */
    updateSettings: async (req: AuthRequest, res: Response, _next: NextFunction) => {
        try {
            if (req.user?.role !== 'PLATFORM_ADMIN') {
                return sendError(res, 'غير مصرح لك بالوصول', 403);
            }

            const entries: { key: string; value: string }[] = req.body;

            if (!Array.isArray(entries) || entries.length === 0) {
                return sendError(res, 'البيانات المرسلة غير صحيحة', 400);
            }

            // Validate keys are known
            const allowedKeys = new Set(Object.keys(DEFAULTS));
            for (const entry of entries) {
                if (!allowedKeys.has(entry.key)) {
                    return sendError(res, `مفتاح غير معروف: ${entry.key}`, 400);
                }
                if (entry.key === 'email.smtpPassword' && entry.value) {
                    entry.value = encrypt(entry.value);
                }
            }

            // Upsert all in a transaction
            await prisma.$transaction(
                entries.map((entry) =>
                    prisma.systemSetting.upsert({
                        where: { key: entry.key },
                        create: { key: entry.key, value: entry.value },
                        update: { value: entry.value },
                    })
                )
            );

            return sendSuccess(res, 'تم حفظ الإعدادات بنجاح');
        } catch (error: any) {
            return sendError(res, error.message, 500);
        }
    },

    /**
     * GET /api/public/settings
     * Returns safe public settings (branding, contact info, legal) - no auth required
     */
    getPublicSettings: async (_req: Request, res: Response) => {
        try {
            const rows = await prisma.systemSetting.findMany({
                where: {
                    key: {
                        in: [
                            'general.siteName',
                            'general.siteDescription',
                            'general.contactEmail',
                            'general.supportPhone',
                            'legal.termsContent',
                            'legal.termsUpdatedAt',
                            'legal.privacyContent',
                            'legal.privacyUpdatedAt',
                        ],
                    },
                },
            });

            const map: Record<string, string> = {};
            // Start with defaults so it always has values
            Object.assign(map, DEFAULTS);
            for (const row of rows) {
                map[row.key] = row.value;
            }

            return res.status(200).json({
                success: true,
                data: {
                    general: {
                        siteName: map['general.siteName'],
                        siteDescription: map['general.siteDescription'],
                        contactEmail: map['general.contactEmail'],
                        supportPhone: map['general.supportPhone'],
                    },
                    legal: {
                        terms: {
                            content: map['legal.termsContent'],
                            updatedAt: map['legal.termsUpdatedAt'],
                        },
                        privacy: {
                            content: map['legal.privacyContent'],
                            updatedAt: map['legal.privacyUpdatedAt'],
                        },
                    }
                },
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'فشل في جلب الإعدادات العامة' });
        }
    },
};

export default settingsController;
