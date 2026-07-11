"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { ShieldIcon } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { BrandLogo } from "@/components/layout/brand-logo";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api/error-messages";
import { signInWithEmail } from "@/lib/auth/session";

function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8ef,transparent_40%),linear-gradient(135deg,#fffdf8_0%,#f6f4ef_100%)]">
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top,#122647,#091121_55%),linear-gradient(180deg,#0d1a31,#091121)] px-12 py-16 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.12),transparent_28%),radial-gradient(circle_at_45%_65%,rgba(255,255,255,0.07),transparent_30%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <BrandLogo
              variant="admin"
              href={routes.admin.adminDashboard}
              imageClassName="max-w-[18rem]"
            />
            <LanguageToggle />
          </div>
          <div className="relative z-10 mt-24 max-w-xl space-y-8">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">
                Authorized administrators only
              </p>
              <h1 className="text-6xl font-black leading-none tracking-tight">
                Admin Control Center
              </h1>
              <div className="h-1 w-20 rounded-full bg-brand-red" />
              <p className="max-w-lg text-xl leading-9 text-white/78">
                Sign in with your administrator email and password to manage products, orders, and operations.
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Access Window</p>
                  <p className="mt-2 text-3xl font-semibold">24/7</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Access Type</p>
                  <p className="mt-2 text-3xl font-semibold">Admin</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-brand-red/30 bg-brand-red/8 p-5">
                <p className="text-xl font-semibold">Authorized administrators only.</p>
                <p className="mt-2 text-sm leading-7 text-white/75">
                  Use your approved admin account to access the dashboard. Unauthenticated sessions are redirected to the admin login screen.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between lg:hidden">
              <BrandLogo variant="admin" href={routes.admin.adminDashboard} compact />
              <LanguageToggle />
            </div>
            {children}
            <div className="mx-auto flex max-w-xl items-start gap-4 rounded-[2rem] border border-border bg-white/80 px-5 py-5 text-sm text-muted-foreground shadow-soft backdrop-blur">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <ShieldIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Authorized administrators only.</p>
                <p className="leading-7">
                  This area is protected by the backend admin session and requires a valid administrator account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeAccountStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isSuccessfulAdminLogin(response) {
  return (
    response &&
    typeof response === "object" &&
    response.user?.role === "admin" &&
    normalizeAccountStatus(response.user?.status) === "active"
  );
}

function getAdminRedirectTarget(access, fallback = routes.admin.adminDashboard) {
  return access.redirectTo || fallback;
}

function getAdminAuthErrorMessage(error, t) {
  if (error?.status === 401) {
    return t("adminLoginFailed");
  }

  if (error?.status === 403) {
    return t("forbidden");
  }

  if (error?.status === 429) {
    return getErrorMessage(error);
  }

  const message = getErrorMessage(error);
  return typeof message === "string" ? message : t("validationError");
}

function AdminLoginForm() {
  const router = useRouter();
  const { logout, refresh } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkAdminSession() {
      try {
        const nextSession = await refresh({ scope: "admin" });

        if (!active) {
          return;
        }

        const access = getAdminAccessState(nextSession);

        if (access.canAccessDashboard && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace(getAdminRedirectTarget(access));
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (error?.status === 401) {
          return;
        }
      }
    }

    checkAdminSession();

    return () => {
      active = false;
    };
  }, [refresh, router]);

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    startTransition(async () => {
      try {
        const response = await signInWithEmail(email.trim(), password);

        if (!isSuccessfulAdminLogin(response)) {
          setPassword("");
          setErrorMessage(t("adminLoginFailed"));
          return;
        }

        setErrorMessage("");
        const nextSession = await refresh({ scope: "admin" });
        const access = getAdminAccessState(nextSession);

        if (access.forbidden) {
          await logout().catch(() => {});
          setErrorMessage(t("forbidden"));
          return;
        }

        if (access.canAccessDashboard) {
          hasRedirectedRef.current = true;
          toast.success(t("adminLogin"), t("adminLoginSuccess"));
          router.replace(getAdminRedirectTarget(access));
          return;
        }

        setPassword("");
        setErrorMessage(t("adminLoginFailed"));
      } catch (error) {
        setPassword("");
        setErrorMessage(getAdminAuthErrorMessage(error, t));
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
        <p className="text-base text-muted-foreground">Authorized administrators only.</p>
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

export function AdminAuthPage() {
  return (
    <AuthShell>
      <AdminLoginForm />
    </AuthShell>
  );
}

export function AdminEntryPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    router.replace(routes.admin.adminDashboard);
  }, [router]);

  return (
    <Container className="flex min-h-[50vh] items-center justify-center py-16">
      <Card className="w-full max-w-xl text-center">
        <p className="text-lg font-semibold text-foreground">{t("adminRedirecting")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkingAdminSession")}</p>
      </Card>
    </Container>
  );
}

export function AdminTotpVerifyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { refresh } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function routeLegacyTotpPath() {
      try {
        const nextSession = await refresh({ scope: "admin" });

        if (!active) {
          return;
        }

        const access = getAdminAccessState(nextSession);
        const target = access.canAccessDashboard
          ? getAdminRedirectTarget(access)
          : routes.admin.adminLogin;

        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace(target);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (error?.status !== 401) {
          setErrorMessage(getAdminAuthErrorMessage(error, t));
        }

        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace(routes.admin.adminLogin);
        }
      }
    }

    routeLegacyTotpPath();

    return () => {
      active = false;
    };
  }, [refresh, router, t]);

  return (
    <Container className="flex min-h-[50vh] items-center justify-center py-16">
      <Card className="w-full max-w-xl text-center">
        <p className="text-lg font-semibold text-foreground">{t("adminRedirecting")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkingAdminSession")}</p>
        {errorMessage ? <p className="mt-4 text-sm text-error">{errorMessage}</p> : null}
      </Card>
    </Container>
  );
}
