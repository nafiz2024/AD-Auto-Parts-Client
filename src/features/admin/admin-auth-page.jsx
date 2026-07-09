"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { BrandLogo } from "@/components/layout/brand-logo";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { getAdminTotpState } from "@/features/admin/admin-access";
import { getTotpStatus, signInWithEmail, verifyTotp } from "@/lib/auth/session";

async function resolveAdminNextStep(session) {
  const access = getAdminAccessState(session);

  if (access.forbidden) {
    return "FORBIDDEN";
  }

  if (access.totpPending) {
    return "TOTP_VERIFICATION_REQUIRED";
  }

  if (access.canAccessDashboard) {
    return "ADMIN_READY";
  }

  if (!access.isAuthenticated || !access.isAdmin || !access.isActive) {
    return "INVALID_CREDENTIALS";
  }

  try {
    const totpStatus = await getTotpStatus();
    const totpState = getAdminTotpState(session, totpStatus);

    if (totpState.enrollmentRequired) {
      return "TOTP_ENROLLMENT_REQUIRED";
    }

    if (totpState.verificationRequired) {
      return "TOTP_VERIFICATION_REQUIRED";
    }
  } catch {
    // Fall through to the default invalid state if the backend does not expose a status route.
  }

  return "INVALID_CREDENTIALS";
}

function AuthShell({ children }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8ef,transparent_40%),linear-gradient(135deg,#fffdf8_0%,#f6f4ef_100%)]">
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top,#122647,#091121_55%),linear-gradient(180deg,#0d1a31,#091121)] px-12 py-16 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.12),transparent_28%),radial-gradient(circle_at_45%_65%,rgba(255,255,255,0.07),transparent_30%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <BrandLogo
              href={routes.public.home}
              className="[&_p:first-child]:text-white [&_.text-brand-red]:text-brand-red [&_.text-muted-foreground]:text-white/80"
            />
            <LanguageToggle />
          </div>
          <div className="relative z-10 mt-24 max-w-xl space-y-8">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">
                {t("secureAdminAccess")}
              </p>
              <h1 className="text-6xl font-black leading-none tracking-tight">
                {t("adminPanelTitle")}
              </h1>
              <div className="h-1 w-20 rounded-full bg-brand-red" />
              <p className="max-w-lg text-xl leading-9 text-white/78">
                {t("adminPanelDescription")}
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">{t("adminSecurityStat")}</p>
                  <p className="mt-2 text-3xl font-semibold">24/7</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">{t("adminTfaStat")}</p>
                  <p className="mt-2 text-3xl font-semibold">TOTP</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-brand-red/30 bg-brand-red/8 p-5">
                <p className="text-xl font-semibold">{t("securityPriority")}</p>
                <p className="mt-2 text-sm leading-7 text-white/75">
                  {t("securityPriorityDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between lg:hidden">
              <BrandLogo href={routes.public.home} compact />
              <LanguageToggle />
            </div>
            {children}
            <div className="mx-auto flex max-w-xl items-start gap-4 rounded-[2rem] border border-border bg-white/80 px-5 py-5 text-sm text-muted-foreground shadow-soft backdrop-blur">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <ShieldIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{t("secureAdminAccess")}</p>
                <p className="leading-7">{t("adminSecurityMessage")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      return;
    }

    if (access.forbidden) {
      auth.logout().catch(() => {});
      return;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return;
    }

    if (access.canAccessDashboard) {
      router.replace(routes.admin.adminDashboard);
    }
  }, [auth, router, t]);

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    startTransition(async () => {
      try {
        const signInResult = await signInWithEmail(email.trim(), password);
        setPassword("");
        const session = await auth.refresh().catch(() => signInResult);
        const nextStep = await resolveAdminNextStep(session);

        if (nextStep === "FORBIDDEN") {
          await auth.logout();
          setErrorMessage(t("forbidden"));
          return;
        }

        if (nextStep === "TOTP_ENROLLMENT_REQUIRED") {
          setErrorMessage(t("adminTotpEnrollmentRequired"));
          return;
        }

        if (nextStep === "TOTP_VERIFICATION_REQUIRED") {
          router.replace(routes.admin.adminTotp);
          return;
        }

        if (nextStep === "ADMIN_READY") {
          toast.success(t("adminLogin"), t("adminLoginSuccess"));
          router.replace(routes.admin.adminDashboard);
          return;
        }

        setErrorMessage(t("adminLoginFailed"));
      } catch (error) {
        setPassword("");
        if (error?.isTotpRequired) {
          try {
            const session = await auth.refresh().catch(() => null);
            const nextStep = await resolveAdminNextStep(session);

            if (nextStep === "TOTP_ENROLLMENT_REQUIRED") {
              setErrorMessage(t("adminTotpEnrollmentRequired"));
              return;
            }

            if (nextStep === "TOTP_VERIFICATION_REQUIRED") {
              router.replace(routes.admin.adminTotp);
              return;
            }
          } catch {
            // Safe fallback to generic login error below.
          }
        }

        setErrorMessage(t("adminLoginFailed"));
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-xl rounded-[2.25rem] px-6 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
        <ShieldIcon className="size-8" />
      </div>
      <div className="mt-6 space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t("adminLogin")}</h1>
        <p className="text-base text-muted-foreground">{t("signInToAdminPanel")}</p>
      </div>

      {errorMessage ? (
        <Alert className="mt-6" variant="error" title={t("validationError")}>
          {errorMessage}
        </Alert>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="admin-email">{t("emailAddress")}</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@adautoparts.sa"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">{t("password")}</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("enterYourPassword")}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? t("signingIn") : t("signIn")}
        </Button>
      </form>
    </Card>
  );
}

function AdminTotpForm() {
  const router = useRouter();
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return;
    }

    if (!access.totpPending && access.canAccessDashboard) {
      router.replace(routes.admin.adminDashboard);
    }
  }, [auth, router]);

  function handleVerify(event) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    setCode(normalizedCode);

    if (normalizedCode.length !== 6) {
      setErrorMessage(t("invalidTotpCode"));
      return;
    }

    startTransition(async () => {
      try {
        await verifyTotp({ code: normalizedCode });
        setCode("");
        const session = await auth.refresh();
        const access = getAdminAccessState(session);

        if (access.canAccessDashboard) {
          toast.success(t("verifyTotp"), t("totpVerifiedSuccess"));
          router.replace(routes.admin.adminDashboard);
          return;
        }

        setErrorMessage(t("totpVerificationRequired"));
      } catch {
        setCode("");
        setErrorMessage(t("invalidTotpCode"));
      }
    });
  }

  async function handleLogout() {
    try {
      await auth.logout();
    } finally {
      router.replace(routes.admin.adminLogin);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl rounded-[2.25rem] px-6 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
        <CheckIcon className="size-8" />
      </div>
      <div className="mt-6 space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t("verifyTotp")}</h1>
        <p className="text-base text-muted-foreground">{t("enterAuthenticationCode")}</p>
      </div>

      {errorMessage ? (
        <Alert className="mt-6" variant="error" title={t("totpVerificationRequired")}>
          {errorMessage}
        </Alert>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={handleVerify}>
        <div className="space-y-2">
          <Label htmlFor="admin-totp-code">{t("authenticationCode")}</Label>
          <Input
            id="admin-totp-code"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            maxLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="text-center text-2xl tracking-[0.35em]"
            required
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="flex-1" size="lg" disabled={isPending}>
            {isPending ? t("verifying") : t("verifyTotp")}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={handleLogout}>
            {t("logout")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminAuthPage({ mode }) {
  return (
    <AuthShell>
      {mode === "login" ? <AdminLoginForm /> : null}
      {mode === "totp" ? <AdminTotpForm /> : null}
    </AuthShell>
  );
}

export function AdminEntryPage() {
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return;
    }

    router.replace(routes.admin.adminDashboard);
  }, [auth, router]);

  return (
    <Container className="flex min-h-[50vh] items-center justify-center py-16">
      <Card className="w-full max-w-xl text-center">
        <p className="text-lg font-semibold text-foreground">{t("adminRedirecting")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkingAdminSession")}</p>
      </Card>
    </Container>
  );
}
