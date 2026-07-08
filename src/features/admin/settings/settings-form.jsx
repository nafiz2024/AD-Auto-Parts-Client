"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
      <Checkbox checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

const TAB_KEYS = [
  "general",
  "contact",
  "delivery",
  "payments",
  "socialMedia",
  "policies",
  "adminProfile",
];

export function getSettingsTabKeys() {
  return TAB_KEYS;
}

export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 w-28 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-4 rounded-[2rem]">
            <div className="h-7 w-44 animate-pulse rounded-2xl bg-muted" />
            {Array.from({ length: 4 }).map((__, innerIndex) => (
              <div key={innerIndex} className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded-2xl bg-muted" />
                <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsForm({
  t,
  activeTab,
  onTabChange,
  form,
  fieldErrors,
  capabilities,
  assets,
  adminProfile,
  accessState,
  isDirty,
  isSubmitting,
  onFieldChange,
  onSave,
  onDiscard,
}) {
  function renderFieldError(name) {
    const value = fieldErrors[name];
    return Array.isArray(value) ? value[0] : value || "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto border-b border-border pb-4">
        {TAB_KEYS.map((tab) => {
          const active = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-red text-white"
                  : "bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              {t(tab)}
            </button>
          );
        })}
      </div>

      {isDirty ? (
        <Alert variant="warning" title={t("youHaveUnsavedChanges")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{t("unsavedChangesDescription")}</p>
            <Button variant="outline" size="sm" onClick={onDiscard}>
              {t("discardChanges")}
            </Button>
          </div>
        </Alert>
      ) : null}

      {activeTab === "general" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title={t("businessInformation")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("businessName")} error={renderFieldError("businessName")}>
                <Input
                  value={form.businessName}
                  onChange={(event) => onFieldChange("businessName", event.target.value)}
                  placeholder="AD Auto Parts"
                />
              </Field>
              <Field label={`${t("businessName")} (${t("arabicContent")})`} error={renderFieldError("businessNameAr")}>
                <Input
                  value={form.businessNameAr}
                  onChange={(event) => onFieldChange("businessNameAr", event.target.value)}
                />
              </Field>
              <Field label={t("tagline")} error={renderFieldError("tagline")}>
                <Input
                  value={form.tagline}
                  onChange={(event) => onFieldChange("tagline", event.target.value)}
                  placeholder="Inspected second-hand auto parts across Saudi Arabia"
                />
              </Field>
              <Field label={`${t("tagline")} (${t("arabicContent")})`} error={renderFieldError("taglineAr")}>
                <Input
                  value={form.taglineAr}
                  onChange={(event) => onFieldChange("taglineAr", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("description")} (${t("englishContent")})`} error={renderFieldError("description")}>
                <Textarea
                  className="min-h-32"
                  value={form.description}
                  onChange={(event) => onFieldChange("description", event.target.value)}
                />
              </Field>
              <Field label={`${t("description")} (${t("arabicContent")})`} error={renderFieldError("descriptionAr")}>
                <Textarea
                  className="min-h-32"
                  value={form.descriptionAr}
                  onChange={(event) => onFieldChange("descriptionAr", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label={t("currency")}>
                <Input value="SAR" disabled />
              </Field>
              <Field label={t("country")}>
                <Input value="SA" disabled />
              </Field>
              <Field label={t("defaultLocale")} error={renderFieldError("defaultLocale")}>
                <Select
                  value={form.defaultLocale}
                  onChange={(event) => onFieldChange("defaultLocale", event.target.value)}
                >
                  <option value="en-SA">en-SA</option>
                  <option value="ar-SA">ar-SA</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <CheckboxField
                label={t("showSoldProducts")}
                checked={form.showSoldProducts}
                onChange={(event) => onFieldChange("showSoldProducts", event.target.checked)}
              />
              <CheckboxField
                label={t("showOutOfStockProducts")}
                checked={form.showOutOfStockProducts}
                onChange={(event) => onFieldChange("showOutOfStockProducts", event.target.checked)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("warrantyInformation")}
                error={renderFieldError("warrantyDisclaimer")}
              >
                <Textarea
                  className="min-h-28"
                  value={form.warrantyDisclaimer}
                  onChange={(event) => onFieldChange("warrantyDisclaimer", event.target.value)}
                />
              </Field>
              <Field
                label={`${t("warrantyInformation")} (${t("arabicContent")})`}
                error={renderFieldError("warrantyDisclaimerAr")}
              >
                <Textarea
                  className="min-h-28"
                  value={form.warrantyDisclaimerAr}
                  onChange={(event) => onFieldChange("warrantyDisclaimerAr", event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title={t("logo")}>
              {assets.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assets.logoUrl}
                  alt={t("logo")}
                  className="h-32 w-full rounded-[1.5rem] border border-border bg-white object-contain p-4"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                  {t("noLogoUploaded")}
                </div>
              )}
              <Alert variant="info" title={t("logo")}>
                {capabilities.canUploadLogo ? t("logoUploadRequiresBackendSupport") : t("logoUploadDeferred")}
              </Alert>
            </SectionCard>

            <SectionCard title={t("favicon")}>
              {assets.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assets.faviconUrl}
                  alt={t("favicon")}
                  className="h-24 w-24 rounded-[1.5rem] border border-border bg-white object-contain p-4"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  {t("noFaviconUploaded")}
                </div>
              )}
              <Alert variant="info" title={t("favicon")}>
                {capabilities.canUploadFavicon ? t("faviconUploadRequiresBackendSupport") : t("faviconUploadDeferred")}
              </Alert>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {activeTab === "contact" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title={t("contactInformation")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("phone")} error={renderFieldError("phone")}>
                <Input
                  value={form.phone}
                  onChange={(event) => onFieldChange("phone", event.target.value)}
                  placeholder="+966 55 234 5678"
                />
              </Field>
              <Field label={t("whatsapp")} error={renderFieldError("whatsapp")}>
                <Input
                  value={form.whatsapp}
                  onChange={(event) => onFieldChange("whatsapp", event.target.value)}
                  placeholder="+966 55 234 5678"
                />
              </Field>
            </div>
            <Field label={t("supportEmail")} error={renderFieldError("supportEmail")}>
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(event) => onFieldChange("supportEmail", event.target.value)}
                placeholder="support@adautoparts.example"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("address")} (${t("englishContent")})`} error={renderFieldError("address")}>
                <Textarea
                  className="min-h-28"
                  value={form.address}
                  onChange={(event) => onFieldChange("address", event.target.value)}
                  placeholder="Riyadh, Saudi Arabia"
                />
              </Field>
              <Field label={`${t("address")} (${t("arabicContent")})`} error={renderFieldError("addressAr")}>
                <Textarea
                  className="min-h-28"
                  value={form.addressAr}
                  onChange={(event) => onFieldChange("addressAr", event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("city")} error={renderFieldError("city")}>
                <Input
                  value={form.city}
                  onChange={(event) => onFieldChange("city", event.target.value)}
                  placeholder="Riyadh"
                />
              </Field>
              <Field label={t("region")} error={renderFieldError("region")}>
                <Input
                  value={form.region}
                  onChange={(event) => onFieldChange("region", event.target.value)}
                  placeholder="Riyadh Region"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title={t("businessHours")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("businessHours")} (${t("englishContent")})`} error={renderFieldError("businessHours")}>
                <Textarea
                  className="min-h-36"
                  value={form.businessHours}
                  onChange={(event) => onFieldChange("businessHours", event.target.value)}
                  placeholder="Sunday - Thursday, 9:00 AM - 6:00 PM"
                />
              </Field>
              <Field label={`${t("businessHours")} (${t("arabicContent")})`} error={renderFieldError("businessHoursAr")}>
                <Textarea
                  className="min-h-36"
                  value={form.businessHoursAr}
                  onChange={(event) => onFieldChange("businessHoursAr", event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeTab === "delivery" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title={t("deliverySettings")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("deliveryFee")} error={renderFieldError("defaultDeliveryFee")} hint={t("sarFieldHint")}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultDeliveryFee}
                  onChange={(event) => onFieldChange("defaultDeliveryFee", event.target.value)}
                />
              </Field>
              <Field label={t("freeDeliveryThreshold")} error={renderFieldError("freeDeliveryThreshold")} hint={t("sarFieldHint")}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.freeDeliveryThreshold}
                  onChange={(event) => onFieldChange("freeDeliveryThreshold", event.target.value)}
                />
              </Field>
            </div>
            <Field label={t("estimatedDeliveryTime")} error={renderFieldError("estimatedDeliveryTime")}>
              <Input
                value={form.estimatedDeliveryTime}
                onChange={(event) => onFieldChange("estimatedDeliveryTime", event.target.value)}
                placeholder="2-5 business days"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("deliveryDisclaimer")} error={renderFieldError("deliveryDisclaimer")}>
                <Textarea
                  className="min-h-32"
                  value={form.deliveryDisclaimer}
                  onChange={(event) => onFieldChange("deliveryDisclaimer", event.target.value)}
                />
              </Field>
              <Field label={`${t("deliveryDisclaimer")} (${t("arabicContent")})`} error={renderFieldError("deliveryDisclaimerAr")}>
                <Textarea
                  className="min-h-32"
                  value={form.deliveryDisclaimerAr}
                  onChange={(event) => onFieldChange("deliveryDisclaimerAr", event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title={t("deliveryPolicy")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("deliveryPolicy")} (${t("englishContent")})`} error={renderFieldError("deliveryPolicy")}>
                <Textarea
                  className="min-h-48"
                  value={form.deliveryPolicy}
                  onChange={(event) => onFieldChange("deliveryPolicy", event.target.value)}
                />
              </Field>
              <Field label={`${t("deliveryPolicy")} (${t("arabicContent")})`} error={renderFieldError("deliveryPolicyAr")}>
                <Textarea
                  className="min-h-48"
                  value={form.deliveryPolicyAr}
                  onChange={(event) => onFieldChange("deliveryPolicyAr", event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeTab === "payments" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title={t("paymentSettings")}>
            <div className="grid gap-3">
              <CheckboxField
                label={t("cashOnDelivery")}
                checked={form.codEnabled}
                onChange={(event) => onFieldChange("codEnabled", event.target.checked)}
              />
              <CheckboxField
                label={t("manualAdvancePayment")}
                checked={form.manualAdvancePaymentEnabled}
                onChange={(event) =>
                  onFieldChange("manualAdvancePaymentEnabled", event.target.checked)
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("paymentInstructions")} (${t("englishContent")})`} error={renderFieldError("manualAdvanceInstructions")}>
                <Textarea
                  className="min-h-36"
                  value={form.manualAdvanceInstructions}
                  onChange={(event) =>
                    onFieldChange("manualAdvanceInstructions", event.target.value)
                  }
                />
              </Field>
              <Field label={`${t("paymentInstructions")} (${t("arabicContent")})`} error={renderFieldError("manualAdvanceInstructionsAr")}>
                <Textarea
                  className="min-h-36"
                  value={form.manualAdvanceInstructionsAr}
                  onChange={(event) =>
                    onFieldChange("manualAdvanceInstructionsAr", event.target.value)
                  }
                />
              </Field>
            </div>
            <Field label={t("bankTransferInstructions")} error={renderFieldError("bankTransferInstructions")}>
              <Textarea
                className="min-h-28"
                value={form.bankTransferInstructions}
                onChange={(event) =>
                  onFieldChange("bankTransferInstructions", event.target.value)
                }
              />
            </Field>
          </SectionCard>

          <SectionCard title={t("paymentDisclaimer")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("paymentDisclaimer")} (${t("englishContent")})`} error={renderFieldError("paymentDisclaimer")}>
                <Textarea
                  className="min-h-40"
                  value={form.paymentDisclaimer}
                  onChange={(event) => onFieldChange("paymentDisclaimer", event.target.value)}
                />
              </Field>
              <Field label={`${t("paymentDisclaimer")} (${t("arabicContent")})`} error={renderFieldError("paymentDisclaimerAr")}>
                <Textarea
                  className="min-h-40"
                  value={form.paymentDisclaimerAr}
                  onChange={(event) => onFieldChange("paymentDisclaimerAr", event.target.value)}
                />
              </Field>
            </div>
            <Alert variant="info" title={t("paymentSettings")}>
              {t("unsupportedGatewayNotice")}
            </Alert>
          </SectionCard>
        </div>
      ) : null}

      {activeTab === "socialMedia" ? (
        <SectionCard title={t("socialMediaLinks")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Facebook" error={renderFieldError("facebook")}>
              <Input
                type="url"
                value={form.facebook}
                onChange={(event) => onFieldChange("facebook", event.target.value)}
              />
            </Field>
            <Field label="Instagram" error={renderFieldError("instagram")}>
              <Input
                type="url"
                value={form.instagram}
                onChange={(event) => onFieldChange("instagram", event.target.value)}
              />
            </Field>
            <Field label="X / Twitter" error={renderFieldError("twitter")}>
              <Input
                type="url"
                value={form.twitter}
                onChange={(event) => onFieldChange("twitter", event.target.value)}
              />
            </Field>
            <Field label="YouTube" error={renderFieldError("youtube")}>
              <Input
                type="url"
                value={form.youtube}
                onChange={(event) => onFieldChange("youtube", event.target.value)}
              />
            </Field>
            <Field label="TikTok" error={renderFieldError("tiktok")}>
              <Input
                type="url"
                value={form.tiktok}
                onChange={(event) => onFieldChange("tiktok", event.target.value)}
              />
            </Field>
            <Field label="LinkedIn" error={renderFieldError("linkedin")}>
              <Input
                type="url"
                value={form.linkedin}
                onChange={(event) => onFieldChange("linkedin", event.target.value)}
              />
            </Field>
            <Field label={t("whatsappLink")} error={renderFieldError("whatsappLink")}>
              <Input
                type="url"
                value={form.whatsappLink}
                onChange={(event) => onFieldChange("whatsappLink", event.target.value)}
              />
            </Field>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "policies" ? (
        <div className="grid gap-6">
          <SectionCard title={t("policyPages")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t("returnPolicy")} (${t("englishContent")})`} error={renderFieldError("returnPolicy")}>
                <Textarea
                  className="min-h-40"
                  value={form.returnPolicy}
                  onChange={(event) => onFieldChange("returnPolicy", event.target.value)}
                />
              </Field>
              <Field label={`${t("returnPolicy")} (${t("arabicContent")})`} error={renderFieldError("returnPolicyAr")}>
                <Textarea
                  className="min-h-40"
                  value={form.returnPolicyAr}
                  onChange={(event) => onFieldChange("returnPolicyAr", event.target.value)}
                />
              </Field>
              <Field label={`${t("termsAndConditions")} (${t("englishContent")})`} error={renderFieldError("termsAndConditions")}>
                <Textarea
                  className="min-h-40"
                  value={form.termsAndConditions}
                  onChange={(event) => onFieldChange("termsAndConditions", event.target.value)}
                />
              </Field>
              <Field label={`${t("termsAndConditions")} (${t("arabicContent")})`} error={renderFieldError("termsAndConditionsAr")}>
                <Textarea
                  className="min-h-40"
                  value={form.termsAndConditionsAr}
                  onChange={(event) => onFieldChange("termsAndConditionsAr", event.target.value)}
                />
              </Field>
              <Field label={`${t("privacyPolicy")} (${t("englishContent")})`} error={renderFieldError("privacyPolicy")}>
                <Textarea
                  className="min-h-40"
                  value={form.privacyPolicy}
                  onChange={(event) => onFieldChange("privacyPolicy", event.target.value)}
                />
              </Field>
              <Field label={`${t("privacyPolicy")} (${t("arabicContent")})`} error={renderFieldError("privacyPolicyAr")}>
                <Textarea
                  className="min-h-40"
                  value={form.privacyPolicyAr}
                  onChange={(event) => onFieldChange("privacyPolicyAr", event.target.value)}
                />
              </Field>
              <Field label={`${t("warrantyPolicy")} (${t("englishContent")})`} error={renderFieldError("warrantyPolicy")}>
                <Textarea
                  className="min-h-40"
                  value={form.warrantyPolicy}
                  onChange={(event) => onFieldChange("warrantyPolicy", event.target.value)}
                />
              </Field>
              <Field label={`${t("warrantyPolicy")} (${t("arabicContent")})`} error={renderFieldError("warrantyPolicyAr")}>
                <Textarea
                  className="min-h-40"
                  value={form.warrantyPolicyAr}
                  onChange={(event) => onFieldChange("warrantyPolicyAr", event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeTab === "adminProfile" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title={t("adminProfile")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("name")}>
                <Input
                  value={adminProfile.name || accessState.user?.name || ""}
                  disabled
                />
              </Field>
              <Field label={t("email")}>
                <Input
                  value={adminProfile.email || accessState.user?.email || ""}
                  disabled={!capabilities.canEditAdminEmail}
                  onChange={() => {}}
                />
              </Field>
            </div>
            <Field label={t("totpStatus")}>
              <Input
                value={
                  adminProfile.totpStatus ||
                  (accessState.totpVerified ? t("verified") : t("verificationRequired"))
                }
                disabled
              />
            </Field>
            {capabilities.canChangePassword && adminProfile.changePasswordUrl ? (
              <Link href={adminProfile.changePasswordUrl}>
                <Button variant="outline">{t("changePassword")}</Button>
              </Link>
            ) : (
              <Alert variant="info" title={t("adminProfile")}>
                {t("adminProfileDeferredDescription")}
              </Alert>
            )}
          </SectionCard>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onDiscard} disabled={!isDirty || isSubmitting}>
          {t("discardChanges")}
        </Button>
        <Button onClick={onSave} disabled={!isDirty || isSubmitting}>
          {isSubmitting ? t("saving") : t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}
