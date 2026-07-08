import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export const DEFAULT_SUPPORT_DETAILS = {
  phone: "+966 55 234 5678",
  whatsapp: "+966 55 234 5678",
  email: "support@adautoparts.example",
  address: "Riyadh, Saudi Arabia",
  city: "Riyadh",
  country: "Saudi Arabia",
  businessHours: "Sunday - Thursday, 9:00 AM - 6:00 PM",
  returnWindowDays: 7,
  returnPolicySummary:
    "Please contact support before returning any item so the team can review the order and advise the next step.",
  socialLinks: {},
  source: "fallback",
};

function coalesceString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function coalesceNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseInt(value, 10);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getEnvelopeData(result) {
  return result?.data ?? result?.raw ?? result ?? {};
}

export function normalizePublicSettings(payload) {
  const data = getEnvelopeData(payload);
  const contact = data?.contact ?? {};
  const support = data?.support ?? {};
  const business = data?.business ?? {};
  const returns = data?.returns ?? data?.returnPolicy ?? {};

  return {
    phone:
      coalesceString(
        contact.phone,
        support.phone,
        data.phone,
        data.supportPhone,
        business.phone,
      ) ?? DEFAULT_SUPPORT_DETAILS.phone,
    whatsapp:
      coalesceString(
        contact.whatsapp,
        contact.whatsappNumber,
        support.whatsapp,
        support.whatsappNumber,
        data.whatsapp,
        data.whatsappNumber,
      ) ?? DEFAULT_SUPPORT_DETAILS.whatsapp,
    email:
      coalesceString(
        contact.email,
        support.email,
        data.email,
        data.supportEmail,
        business.email,
      ) ?? DEFAULT_SUPPORT_DETAILS.email,
    address:
      coalesceString(
        contact.address,
        business.address,
        data.address,
        data.location,
      ) ?? DEFAULT_SUPPORT_DETAILS.address,
    city:
      coalesceString(contact.city, business.city, data.city) ??
      DEFAULT_SUPPORT_DETAILS.city,
    country:
      coalesceString(contact.country, business.country, data.country) ??
      DEFAULT_SUPPORT_DETAILS.country,
    businessHours:
      coalesceString(
        support.businessHours,
        business.businessHours,
        data.businessHours,
        data.hours,
      ) ?? DEFAULT_SUPPORT_DETAILS.businessHours,
    returnWindowDays:
      coalesceNumber(
        returns.windowDays,
        returns.returnWindowDays,
        data.returnWindowDays,
        data.returnPeriodDays,
      ) ?? DEFAULT_SUPPORT_DETAILS.returnWindowDays,
    returnPolicySummary:
      coalesceString(
        returns.summary,
        returns.customerSummary,
        data.returnPolicySummary,
      ) ?? DEFAULT_SUPPORT_DETAILS.returnPolicySummary,
    socialLinks:
      data.socialLinks && typeof data.socialLinks === "object"
        ? data.socialLinks
        : DEFAULT_SUPPORT_DETAILS.socialLinks,
    source: "live",
  };
}

export async function getPublicSupportSettings() {
  try {
    const result = await apiGet(endpoints.public.settings);
    return normalizePublicSettings(result);
  } catch (error) {
    return {
      ...DEFAULT_SUPPORT_DETAILS,
      error,
    };
  }
}

export async function submitPublicEnquiry(payload) {
  const body = {
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || undefined,
    subject: payload.subject,
    message: payload.message,
    enquiryType: payload.enquiryType || undefined,
  };

  const result = await apiPost(endpoints.public.enquiries, body);
  return getEnvelopeData(result);
}
