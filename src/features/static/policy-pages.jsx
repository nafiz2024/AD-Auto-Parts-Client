"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { DEFAULT_SUPPORT_DETAILS } from "@/features/support/support-api";

function PolicyShell({ title, description, items, sidebarTitle, footerNote, children }) {
  const { t } = useLanguage();

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="grid gap-6 py-8 pb-16 xl:grid-cols-[280px_minmax(0,1fr)] xl:py-10">
        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <Card className="rounded-[2rem] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
              {sidebarTitle}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item, index) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm leading-6 text-muted-foreground transition hover:text-brand-red"
                >
                  {index + 1}. {item.title}
                </a>
              ))}
            </div>
          </Card>
          <Card className="rounded-[2rem] p-5">
            <h2 className="text-xl font-semibold text-foreground">{t("needHelp")}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {footerNote}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Link href={routes.public.contact}>
                <Button className="w-full">
                  {t("contactUs")}
                  <ArrowRightIcon className="size-4" />
                </Button>
              </Link>
              <a
                href={`https://wa.me/${DEFAULT_SUPPORT_DETAILS.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="w-full">
                  {t("whatsappSupport")}
                </Button>
              </a>
            </div>
          </Card>
        </aside>
        <div className="space-y-6">
          <div className="space-y-4">
            <Breadcrumbs
              items={[
                { label: t("home"), href: routes.public.home },
                { label: title },
              ]}
            />
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="max-w-4xl text-base leading-8 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {children}
        </div>
      </Container>
    </div>
  );
}

function PolicySection({ id, title, children }) {
  return (
    <section id={id} className="rounded-[2rem] border border-border/70 bg-white px-6 py-6 shadow-soft scroll-mt-28">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function ReturnPolicyPage() {
  const { language, t } = useLanguage();
  const returnWindowDays = DEFAULT_SUPPORT_DETAILS.returnWindowDays;
  const returnWindowLine =
    language === "ar"
      ? `خلال ${returnWindowDays} أيام من تاريخ التسليم الموثق في الطلب.`
      : `Within ${returnWindowDays} days from the documented delivery date on the order.`;
  const items = [
    { id: "eligibility", title: t("returnEligibility") },
    { id: "compatibility", title: t("compatibilityResponsibility") },
    { id: "condition", title: t("returnCondition") },
    { id: "non-returnable", title: t("nonReturnableCases") },
    { id: "refund-review", title: t("refundReviewProcess") },
    { id: "support-first", title: t("contactSupportBeforeReturn") },
  ];

  return (
    <PolicyShell
      title={t("returnPolicy")}
      description={t("returnPolicyIntro")}
      items={items}
      sidebarTitle={t("onThisPage")}
      footerNote={t("returnHelpNote")}
    >
      <PolicySection id="eligibility" title={t("returnEligibility")}>
        <p>{t("returnEligibilityCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("returnEligibilityDamage")}</li>
          <li>{t("returnEligibilityWrongItem")}</li>
          <li>{t("returnEligibilityDescriptionMismatch")}</li>
          <li>{returnWindowLine}</li>
        </ul>
      </PolicySection>

      <PolicySection id="compatibility" title={t("compatibilityResponsibility")}>
        <p>{t("returnCompatibilityCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("returnCompatibilityVehicleDetails")}</li>
          <li>{t("returnCompatibilitySupport")}</li>
          <li>{t("returnCompatibilityReminder")}</li>
        </ul>
      </PolicySection>

      <PolicySection id="condition" title={t("returnCondition")}>
        <p>{t("returnConditionCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("returnConditionUnused")}</li>
          <li>{t("returnConditionPackaging")}</li>
          <li>{t("returnConditionNoDamage")}</li>
        </ul>
      </PolicySection>

      <PolicySection id="non-returnable" title={t("nonReturnableCases")}>
        <p>{t("nonReturnableCasesCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("nonReturnableInstalled")}</li>
          <li>{t("nonReturnableConsumables")}</li>
          <li>{t("nonReturnableMisuse")}</li>
          <li>{t("nonReturnableClearance")}</li>
        </ul>
      </PolicySection>

      <PolicySection id="refund-review" title={t("refundReviewProcess")}>
        <p>{t("refundReviewCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("refundApprovedStep")}</li>
          <li>{t("refundCompletedStep")}</li>
          <li>{t("refundNoInstantPromise")}</li>
        </ul>
      </PolicySection>

      <PolicySection id="support-first" title={t("contactSupportBeforeReturn")}>
        <p>{t("contactSupportBeforeReturnCopy")}</p>
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
          {t("contactSupportBeforeReturnAlert")}
        </div>
      </PolicySection>
    </PolicyShell>
  );
}

export function TermsPage() {
  const { t } = useLanguage();
  const items = [
    { id: "product-condition", title: t("productCondition") },
    { id: "compatibility", title: t("compatibilityResponsibility") },
    { id: "pricing", title: t("pricingAndCurrency") },
    { id: "orders", title: t("orderPlacement") },
    { id: "payments", title: t("paymentMethod") },
    { id: "delivery", title: t("delivery") },
    { id: "returns", title: t("returnsAndRefunds") },
    { id: "liability", title: t("limitationOfLiability") },
  ];

  return (
    <PolicyShell
      title={t("termsAndConditions")}
      description={t("termsIntro")}
      items={items}
      sidebarTitle={t("termsOverview")}
      footerNote={t("termsHelpNote")}
    >
      <PolicySection id="product-condition" title={t("productCondition")}>
        <p>{t("termsProductConditionCopy")}</p>
      </PolicySection>

      <PolicySection id="compatibility" title={t("compatibilityResponsibility")}>
        <p>{t("termsCompatibilityCopy")}</p>
      </PolicySection>

      <PolicySection id="pricing" title={t("pricingAndCurrency")}>
        <p>{t("termsPricingCopy")}</p>
      </PolicySection>

      <PolicySection id="orders" title={t("orderPlacement")}>
        <p>{t("termsOrderPlacementCopy")}</p>
      </PolicySection>

      <PolicySection id="payments" title={t("paymentMethod")}>
        <p>{t("termsPaymentsCopy")}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("termsCodOnly")}</li>
          <li>{t("termsManualAdvanceOnly")}</li>
        </ul>
      </PolicySection>

      <PolicySection id="delivery" title={t("delivery")}>
        <p>{t("termsDeliveryCopy")}</p>
      </PolicySection>

      <PolicySection id="returns" title={t("returnsAndRefunds")}>
        <p>{t("termsReturnsCopy")}</p>
      </PolicySection>

      <PolicySection id="liability" title={t("limitationOfLiability")}>
        <p>{t("termsLiabilityCopy")}</p>
      </PolicySection>
    </PolicyShell>
  );
}

export function PrivacyPolicyPage() {
  const { t } = useLanguage();
  const items = [
    { id: "information", title: t("privacyInformationWeCollect") },
    { id: "usage", title: t("privacyHowWeUseInfo") },
    { id: "security", title: t("privacySecurity") },
    { id: "sharing", title: t("privacySharing") },
    { id: "contact", title: t("privacyContact") },
  ];

  return (
    <PolicyShell
      title={t("privacyPolicy")}
      description={t("privacyIntro")}
      items={items}
      sidebarTitle={t("privacyOverview")}
      footerNote={t("privacyHelpNote")}
    >
      <PolicySection id="information" title={t("privacyInformationWeCollect")}>
        <p>{t("privacyInformationCopy")}</p>
      </PolicySection>
      <PolicySection id="usage" title={t("privacyHowWeUseInfo")}>
        <p>{t("privacyUsageCopy")}</p>
      </PolicySection>
      <PolicySection id="security" title={t("privacySecurity")}>
        <p>{t("privacySecurityCopy")}</p>
      </PolicySection>
      <PolicySection id="sharing" title={t("privacySharing")}>
        <p>{t("privacySharingCopy")}</p>
      </PolicySection>
      <PolicySection id="contact" title={t("privacyContact")}>
        <p>{t("privacyContactCopy")}</p>
      </PolicySection>
    </PolicyShell>
  );
}
