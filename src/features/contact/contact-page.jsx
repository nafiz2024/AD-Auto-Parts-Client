"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  ShieldIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, getRequestId } from "@/lib/api/error-messages";
import {
  DEFAULT_SUPPORT_DETAILS,
  getPublicSupportSettings,
  submitPublicEnquiry,
} from "@/features/support/support-api";

function createInitialForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    enquiryType: "",
  };
}

function getFieldError(fieldErrors, field) {
  const value = fieldErrors[field];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function ContactPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(createInitialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [supportDetails, setSupportDetails] = useState(DEFAULT_SUPPORT_DETAILS);
  const [supportSource, setSupportSource] = useState("loading");
  const [isSubmitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    getPublicSupportSettings().then((settings) => {
      if (!mounted) {
        return;
      }

      setSupportDetails(settings);
      setSupportSource(settings.source ?? "fallback");
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setForm((currentForm) => ({
        ...currentForm,
        fullName: currentForm.fullName || user?.name || user?.fullName || "",
        email: currentForm.email || user?.email || "",
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const whatsappHref = useMemo(
    () =>
      `https://wa.me/${supportDetails.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I need help with AD Auto Parts.")}`,
    [supportDetails.whatsapp],
  );

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Message is required.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(t("validationError"), t("reviewRequiredFields"));
      return;
    }

    setSubmitError(null);

    startSubmitTransition(async () => {
      try {
        const response = await submitPublicEnquiry(form);
        toast.success(
          t("enquirySent"),
          response?.message || t("weWillReplySoon"),
        );
        setForm((currentForm) => ({
          ...createInitialForm(),
          fullName: currentForm.fullName,
          email: currentForm.email,
        }));
        setFieldErrors({});
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        setSubmitError(error);
        toast.error(t("failedToSendMessage"), getErrorMessage(error));
      }
    });
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_24%,#f8f7f4_100%)]">
      <section className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(9,17,33,0.09),transparent_38%),linear-gradient(125deg,#091121_0%,#112240_45%,#0f1b31_100%)] text-white">
        <Container className="space-y-5 py-8 lg:py-12">
          <Breadcrumbs
            items={[
              { label: t("home"), href: routes.public.home },
              { label: t("contactUs") },
            ]}
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                {t("support")}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t("contactUs")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/78">
                {t("contactSupportIntro")}
              </p>
            </div>
            <Card className="rounded-[2rem] border-white/10 bg-white/8 p-5 text-white shadow-none backdrop-blur">
              <CardTitle className="text-white">{t("whatsappSupport")}</CardTitle>
              <CardDescription className="text-white/72">
                {t("contactQuickHelp")}
              </CardDescription>
              <div className="mt-5 space-y-3">
                <p className="text-lg font-semibold">{supportDetails.whatsapp}</p>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button className="bg-brand-red hover:bg-brand-red/90">
                    <WhatsappIcon className="size-5 shrink-0" />
                    {t("chatOnWhatsapp")}
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 py-8 pb-16 xl:grid-cols-[360px_minmax(0,1fr)] xl:py-10">
        <div className="space-y-6">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{t("getInTouch")}</CardTitle>
              <CardDescription>{t("contactSupportDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{t("phone")}</p>
                <p>{supportDetails.phone}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("whatsappSupport")}</p>
                <p>{supportDetails.whatsapp}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("email")}</p>
                <p>{supportDetails.email}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("location")}</p>
                <p>{supportDetails.address}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("businessHours")}</p>
                <p>{supportDetails.businessHours}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{t("ourLocation")}</CardTitle>
              <CardDescription>{t("locationPlaceholderNote")}</CardDescription>
            </CardHeader>
            <div className="rounded-[1.5rem] border border-dashed border-border bg-[linear-gradient(135deg,rgba(9,17,33,0.03),rgba(230,57,70,0.06))] px-5 py-12 text-center">
              <p className="text-base font-semibold text-foreground">{supportDetails.city}</p>
              <p className="mt-2 text-sm text-muted-foreground">{supportDetails.country}</p>
            </div>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{t("helpLinks")}</CardTitle>
              <CardDescription>{t("helpLinksDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={routes.public.trackOrder} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-brand-red hover:text-brand-red">
                <span>{t("trackOrder")}</span>
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href={routes.public.returnPolicy} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-brand-red hover:text-brand-red">
                <span>{t("returnPolicy")}</span>
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href={routes.public.termsAndConditions} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-brand-red hover:text-brand-red">
                <span>{t("termsAndConditions")}</span>
                <ArrowRightIcon className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>{t("sendMessage")}</CardTitle>
            <CardDescription>{t("sendMessageDescription")}</CardDescription>
          </CardHeader>

          {supportSource === "fallback" ? (
            <Alert variant="info" title={t("supportDetailsFallback")}>
              {t("showingSupportFallback")}
            </Alert>
          ) : null}

          {submitError ? (
            <Alert variant="error" title={t("failedToSendMessage")}>
              {getErrorMessage(submitError)}
              {getRequestId(submitError) ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Request ID: {getRequestId(submitError)}
                </p>
              ) : null}
            </Alert>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("fullName")}</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Ali Alharbi"
                  aria-invalid={getFieldError(fieldErrors, "fullName") ? "true" : "false"}
                />
                {getFieldError(fieldErrors, "fullName") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "fullName")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={getFieldError(fieldErrors, "email") ? "true" : "false"}
                />
                {getFieldError(fieldErrors, "email") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "email")}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneOptional")}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  aria-invalid={getFieldError(fieldErrors, "phone") ? "true" : "false"}
                />
                {getFieldError(fieldErrors, "phone") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "phone")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="enquiryType">{t("enquiryType")}</Label>
                <Select
                  id="enquiryType"
                  value={form.enquiryType}
                  onChange={(event) => updateField("enquiryType", event.target.value)}
                  aria-invalid={getFieldError(fieldErrors, "enquiryType") ? "true" : "false"}
                >
                  <option value="">{t("selectOptionalType")}</option>
                  <option value="general-support">{t("generalSupport")}</option>
                  <option value="compatibility">{t("compatibilitySupport")}</option>
                  <option value="delivery">{t("deliverySupport")}</option>
                  <option value="returns">{t("returnsSupport")}</option>
                </Select>
                {getFieldError(fieldErrors, "enquiryType") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "enquiryType")}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject")}</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder={t("subjectPlaceholder")}
                aria-invalid={getFieldError(fieldErrors, "subject") ? "true" : "false"}
              />
              {getFieldError(fieldErrors, "subject") ? (
                <p className="text-sm text-error">{getFieldError(fieldErrors, "subject")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("message")}</Label>
              <Textarea
                id="message"
                className="min-h-36"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder={t("messagePlaceholder")}
                aria-invalid={getFieldError(fieldErrors, "message") ? "true" : "false"}
              />
              {getFieldError(fieldErrors, "message") ? (
                <p className="text-sm text-error">{getFieldError(fieldErrors, "message")}</p>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-[#f8f7f4] px-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldIcon className="mt-0.5 size-5 text-brand-navy" />
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("contactPrivacyNote")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <RefreshCcwIcon className="size-4 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <MessageCircleIcon className="size-5" />
                    {t("sendMessage")}
                  </>
                )}
              </Button>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button type="button" variant="outline" size="lg">
                  <WhatsappIcon className="size-5 shrink-0 text-[#25d366]" />
                  {t("chatOnWhatsapp")}
                </Button>
              </a>
              <Link href={routes.public.shop}>
                <Button type="button" variant="ghost" size="lg">
                  {t("shopAutoParts")}
                  <ExternalLinkIcon className="size-4" />
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
}
