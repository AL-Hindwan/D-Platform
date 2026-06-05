import apiClient from './api-client';

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    maintenanceMode: string;
    registrationEnabled: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
  };
  legal: {
    termsContent: string;
    termsUpdatedAt: string;
    privacyContent: string;
    privacyUpdatedAt: string;
  };
}

export interface LegalContent {
  terms: { content: string; updatedAt: string };
  privacy: { content: string; updatedAt: string };
}

class SettingsService {
  /**
   * GET /api/admin/settings — جلب كل الإعدادات (admin)
   */
  async getSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: SystemSettings;
    }>('/api/admin/settings');
    return response.data.data;
  }

  /**
   * PUT /api/admin/settings — حفظ قسم معين من الإعدادات
   * يحوّل الـ object إلى مصفوفة key-value للـ backend
   */
  async saveSection(
    section: string,
    values: Record<string, string>
  ): Promise<void> {
    const entries = Object.entries(values).map(([field, value]) => ({
      key: `${section}.${field}`,
      value,
    }));
    await apiClient.put('/api/admin/settings', entries);
  }
}

export const settingsService = new SettingsService();

export interface PublicSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
  };
  legal: {
    terms: {
      content: string;
      updatedAt: string;
    };
    privacy: {
      content: string;
      updatedAt: string;
    };
  };
}

/**
 * جلب الإعدادات العامة من الـ API العام (للاستخدام في server components)
 */
export async function fetchPublicSettings(): Promise<PublicSettings> {
  const defaultLegal = {
    content: "",
    updatedAt: "",
  };

  const defaultGeneral = {
    siteName: "منصة دال",
    siteDescription: "منصة شاملة لحجز وإدارة الدورات التدريبية",
    contactEmail: "support@platform.com",
    supportPhone: "",
  };

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${apiBase}/api/public/settings`, {
      cache: 'no-store', // always fetch fresh — reflects admin changes immediately
    });
    if (!res.ok) {
      return { general: defaultGeneral, legal: { terms: defaultLegal, privacy: defaultLegal } };
    }

    const data = await res.json();
    return data.data || { general: defaultGeneral, legal: { terms: defaultLegal, privacy: defaultLegal } };
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return { general: defaultGeneral, legal: { terms: defaultLegal, privacy: defaultLegal } };
  }
}
