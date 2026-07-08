import { apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function firstNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }
  }

  return null;
}

function getEnvelopeData(result) {
  return result?.data ?? result?.raw ?? result ?? {};
}

function sanitizeDisplayUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return "";
}

function resolveSection(data, key) {
  const value = data?.[key];
  return value && typeof value === "object" ? value : {};
}

function normalizeSocialLinks(section) {
  return {
    facebook: firstString(section?.facebook, section?.facebookUrl),
    instagram: firstString(section?.instagram, section?.instagramUrl),
    twitter: firstString(section?.twitter, section?.x, section?.twitterUrl, section?.xUrl),
    youtube: firstString(section?.youtube, section?.youtubeUrl),
    tiktok: firstString(section?.tiktok, section?.tiktokUrl),
    linkedin: firstString(section?.linkedin, section?.linkedinUrl),
    whatsappLink: firstString(
      section?.whatsappLink,
      section?.whatsappUrl,
      section?.whatsAppLink,
    ),
  };
}

export function createEmptyAdminSettingsForm() {
  return {
    businessName: "",
    businessNameAr: "",
    tagline: "",
    taglineAr: "",
    description: "",
    descriptionAr: "",
    defaultCurrency: "SAR",
    defaultCountry: "SA",
    defaultLocale: "en-SA",
    showSoldProducts: false,
    showOutOfStockProducts: true,
    warrantyDisclaimer: "",
    warrantyDisclaimerAr: "",
    phone: "",
    whatsapp: "",
    supportEmail: "",
    address: "",
    addressAr: "",
    city: "",
    region: "",
    businessHours: "",
    businessHoursAr: "",
    defaultDeliveryFee: "",
    freeDeliveryThreshold: "",
    estimatedDeliveryTime: "",
    deliveryDisclaimer: "",
    deliveryDisclaimerAr: "",
    manualAdvanceInstructions: "",
    manualAdvanceInstructionsAr: "",
    bankTransferInstructions: "",
    paymentDisclaimer: "",
    paymentDisclaimerAr: "",
    codEnabled: true,
    manualAdvancePaymentEnabled: true,
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    whatsappLink: "",
    returnPolicy: "",
    returnPolicyAr: "",
    termsAndConditions: "",
    termsAndConditionsAr: "",
    privacyPolicy: "",
    privacyPolicyAr: "",
    warrantyPolicy: "",
    warrantyPolicyAr: "",
    deliveryPolicy: "",
    deliveryPolicyAr: "",
  };
}

export function normalizeAdminSettings(payload) {
  const data = getEnvelopeData(payload);
  const settings = data?.settings ?? data?.data ?? data;
  const general = resolveSection(settings, "general");
  const contact = resolveSection(settings, "contact");
  const delivery = resolveSection(settings, "delivery");
  const payments = resolveSection(settings, "payments");
  const social = resolveSection(settings, "socialMedia");
  const policies = resolveSection(settings, "policies");
  const profile = resolveSection(settings, "adminProfile");
  const capabilities =
    settings?.capabilities && typeof settings.capabilities === "object"
      ? settings.capabilities
      : data?.capabilities && typeof data.capabilities === "object"
        ? data.capabilities
        : {};
  const socialLinks = normalizeSocialLinks(social);

  return {
    form: {
      businessName: firstString(general?.businessName, settings?.businessName, settings?.name),
      businessNameAr: firstString(general?.businessNameAr, settings?.businessNameAr),
      tagline: firstString(general?.tagline, settings?.tagline),
      taglineAr: firstString(general?.taglineAr, settings?.taglineAr),
      description: firstString(general?.description, settings?.description),
      descriptionAr: firstString(general?.descriptionAr, settings?.descriptionAr),
      defaultCurrency:
        firstString(general?.defaultCurrency, settings?.defaultCurrency) || "SAR",
      defaultCountry:
        firstString(general?.defaultCountry, settings?.defaultCountry) || "SA",
      defaultLocale:
        firstString(general?.defaultLocale, settings?.defaultLocale) || "en-SA",
      showSoldProducts:
        firstBoolean(general?.showSoldProducts, settings?.showSoldProducts) ?? false,
      showOutOfStockProducts:
        firstBoolean(
          general?.showOutOfStockProducts,
          settings?.showOutOfStockProducts,
        ) ?? true,
      warrantyDisclaimer: firstString(
        general?.warrantyDisclaimer,
        general?.returnDisclaimer,
        settings?.warrantyDisclaimer,
      ),
      warrantyDisclaimerAr: firstString(
        general?.warrantyDisclaimerAr,
        general?.returnDisclaimerAr,
        settings?.warrantyDisclaimerAr,
      ),
      phone: firstString(contact?.phone, settings?.phone),
      whatsapp: firstString(contact?.whatsapp, contact?.whatsappNumber, settings?.whatsapp),
      supportEmail: firstString(
        contact?.supportEmail,
        contact?.email,
        settings?.supportEmail,
        settings?.email,
      ),
      address: firstString(contact?.address, settings?.address),
      addressAr: firstString(contact?.addressAr, settings?.addressAr),
      city: firstString(contact?.city, settings?.city),
      region: firstString(contact?.region, contact?.state, settings?.region),
      businessHours: firstString(contact?.businessHours, settings?.businessHours),
      businessHoursAr: firstString(contact?.businessHoursAr, settings?.businessHoursAr),
      defaultDeliveryFee:
        firstNumber(delivery?.defaultDeliveryFee, delivery?.deliveryFee, settings?.defaultDeliveryFee) ??
        "",
      freeDeliveryThreshold:
        firstNumber(
          delivery?.freeDeliveryThreshold,
          delivery?.freeDeliveryMinimum,
          settings?.freeDeliveryThreshold,
        ) ?? "",
      estimatedDeliveryTime: firstString(
        delivery?.estimatedDeliveryTime,
        settings?.estimatedDeliveryTime,
      ),
      deliveryDisclaimer: firstString(
        delivery?.deliveryDisclaimer,
        delivery?.deliverySummary,
        settings?.deliveryDisclaimer,
      ),
      deliveryDisclaimerAr: firstString(
        delivery?.deliveryDisclaimerAr,
        delivery?.deliverySummaryAr,
        settings?.deliveryDisclaimerAr,
      ),
      manualAdvanceInstructions: firstString(
        payments?.manualAdvanceInstructions,
        payments?.manualPaymentInstructions,
        settings?.manualAdvanceInstructions,
      ),
      manualAdvanceInstructionsAr: firstString(
        payments?.manualAdvanceInstructionsAr,
        payments?.manualPaymentInstructionsAr,
        settings?.manualAdvanceInstructionsAr,
      ),
      bankTransferInstructions: firstString(
        payments?.bankTransferInstructions,
        payments?.transferInstructions,
        settings?.bankTransferInstructions,
      ),
      paymentDisclaimer: firstString(
        payments?.paymentDisclaimer,
        settings?.paymentDisclaimer,
      ),
      paymentDisclaimerAr: firstString(
        payments?.paymentDisclaimerAr,
        settings?.paymentDisclaimerAr,
      ),
      codEnabled:
        firstBoolean(payments?.codEnabled, payments?.cashOnDeliveryEnabled, settings?.codEnabled) ??
        true,
      manualAdvancePaymentEnabled:
        firstBoolean(
          payments?.manualAdvancePaymentEnabled,
          payments?.manualPaymentEnabled,
          settings?.manualAdvancePaymentEnabled,
        ) ?? true,
      facebook: socialLinks.facebook,
      instagram: socialLinks.instagram,
      twitter: socialLinks.twitter,
      youtube: socialLinks.youtube,
      tiktok: socialLinks.tiktok,
      linkedin: socialLinks.linkedin,
      whatsappLink: socialLinks.whatsappLink,
      returnPolicy: firstString(
        policies?.returnPolicy,
        settings?.returnPolicy,
      ),
      returnPolicyAr: firstString(
        policies?.returnPolicyAr,
        settings?.returnPolicyAr,
      ),
      termsAndConditions: firstString(
        policies?.termsAndConditions,
        settings?.termsAndConditions,
      ),
      termsAndConditionsAr: firstString(
        policies?.termsAndConditionsAr,
        settings?.termsAndConditionsAr,
      ),
      privacyPolicy: firstString(
        policies?.privacyPolicy,
        settings?.privacyPolicy,
      ),
      privacyPolicyAr: firstString(
        policies?.privacyPolicyAr,
        settings?.privacyPolicyAr,
      ),
      warrantyPolicy: firstString(
        policies?.warrantyPolicy,
        settings?.warrantyPolicy,
      ),
      warrantyPolicyAr: firstString(
        policies?.warrantyPolicyAr,
        settings?.warrantyPolicyAr,
      ),
      deliveryPolicy: firstString(
        policies?.deliveryPolicy,
        delivery?.deliveryPolicy,
        settings?.deliveryPolicy,
      ),
      deliveryPolicyAr: firstString(
        policies?.deliveryPolicyAr,
        delivery?.deliveryPolicyAr,
        settings?.deliveryPolicyAr,
      ),
    },
    assets: {
      logoUrl: sanitizeDisplayUrl(
        general?.logoUrl ?? general?.logo ?? settings?.logoUrl ?? settings?.logo,
      ),
      faviconUrl: sanitizeDisplayUrl(
        general?.faviconUrl ?? general?.favicon ?? settings?.faviconUrl ?? settings?.favicon,
      ),
    },
    capabilities: {
      canUploadLogo:
        firstBoolean(capabilities?.canUploadLogo, general?.canUploadLogo) ?? false,
      canUploadFavicon:
        firstBoolean(capabilities?.canUploadFavicon, general?.canUploadFavicon) ?? false,
      canManageAdminProfile:
        firstBoolean(capabilities?.canManageAdminProfile, profile?.supported) ?? false,
      canChangePassword:
        firstBoolean(capabilities?.canChangePassword, profile?.canChangePassword) ?? false,
      canEditAdminEmail:
        firstBoolean(capabilities?.canEditAdminEmail, profile?.canEditEmail) ?? false,
    },
    adminProfile: {
      name: firstString(profile?.name, settings?.adminName),
      email: firstString(profile?.email, settings?.adminEmail),
      totpStatus: firstString(profile?.totpStatus),
      changePasswordUrl: firstString(profile?.changePasswordUrl),
    },
  };
}

function normalizeNumericField(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number.parseFloat(String(value));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function buildAdminSettingsPayload(form) {
  return {
    general: {
      businessName: form.businessName.trim(),
      businessNameAr: form.businessNameAr.trim(),
      tagline: form.tagline.trim(),
      taglineAr: form.taglineAr.trim(),
      description: form.description.trim(),
      descriptionAr: form.descriptionAr.trim(),
      defaultCurrency: "SAR",
      defaultCountry: "SA",
      defaultLocale: form.defaultLocale.trim() || "en-SA",
      showSoldProducts: Boolean(form.showSoldProducts),
      showOutOfStockProducts: Boolean(form.showOutOfStockProducts),
      warrantyDisclaimer: form.warrantyDisclaimer.trim(),
      warrantyDisclaimerAr: form.warrantyDisclaimerAr.trim(),
    },
    contact: {
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      supportEmail: form.supportEmail.trim(),
      address: form.address.trim(),
      addressAr: form.addressAr.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
      businessHours: form.businessHours.trim(),
      businessHoursAr: form.businessHoursAr.trim(),
    },
    delivery: {
      defaultDeliveryFee: normalizeNumericField(form.defaultDeliveryFee),
      freeDeliveryThreshold: normalizeNumericField(form.freeDeliveryThreshold),
      estimatedDeliveryTime: form.estimatedDeliveryTime.trim(),
      deliveryDisclaimer: form.deliveryDisclaimer.trim(),
      deliveryDisclaimerAr: form.deliveryDisclaimerAr.trim(),
      deliveryPolicy: form.deliveryPolicy.trim(),
      deliveryPolicyAr: form.deliveryPolicyAr.trim(),
    },
    payments: {
      codEnabled: Boolean(form.codEnabled),
      manualAdvancePaymentEnabled: Boolean(form.manualAdvancePaymentEnabled),
      manualAdvanceInstructions: form.manualAdvanceInstructions.trim(),
      manualAdvanceInstructionsAr: form.manualAdvanceInstructionsAr.trim(),
      bankTransferInstructions: form.bankTransferInstructions.trim(),
      paymentDisclaimer: form.paymentDisclaimer.trim(),
      paymentDisclaimerAr: form.paymentDisclaimerAr.trim(),
    },
    socialMedia: {
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
      twitter: form.twitter.trim(),
      youtube: form.youtube.trim(),
      tiktok: form.tiktok.trim(),
      linkedin: form.linkedin.trim(),
      whatsappLink: form.whatsappLink.trim(),
    },
    policies: {
      returnPolicy: form.returnPolicy.trim(),
      returnPolicyAr: form.returnPolicyAr.trim(),
      termsAndConditions: form.termsAndConditions.trim(),
      termsAndConditionsAr: form.termsAndConditionsAr.trim(),
      privacyPolicy: form.privacyPolicy.trim(),
      privacyPolicyAr: form.privacyPolicyAr.trim(),
      warrantyPolicy: form.warrantyPolicy.trim(),
      warrantyPolicyAr: form.warrantyPolicyAr.trim(),
    },
  };
}

export async function getAdminSettings() {
  const result = await apiGet(endpoints.admin.settings);
  return normalizeAdminSettings(result);
}

export async function updateAdminSettings(form) {
  const result = await apiPatch(endpoints.admin.settings, buildAdminSettingsPayload(form));
  return normalizeAdminSettings(result);
}
