"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getCustomerPasswordError } from "@/lib/auth/customer-password";
import { sanitizeCustomerRedirect } from "@/lib/auth/customer-auth";
import { getErrorMessage } from "@/lib/api/error-messages";
import { getSessionRole, signInWithEmail, signInWithSocial, signUpWithEmail } from "@/lib/auth/session";
import { buildQueryString } from "@/lib/api/query";

function AuthPageShell({ title, description, children }) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-[2.25rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
          {children}
        </Card>
      </div>
    </Container>
  );
}

function CustomerAuthGuard({ role, t }) {
  if (role !== "admin") {
    return null;
  }

  return (
    <Alert className="mt-6" variant="warning" title={t("customerOnlyArea")}>
      {t("customerOnlyAreaDescription")}
    </Alert>
  );
}

function resolveAuthError(error, t) {
  if (error?.isAuthError || error?.status === 401) {
    return t("invalidEmailOrPassword");
  }

  if (error?.isValidationError) {
    return error.message || t("pleaseReviewYourDetails");
  }

  return getErrorMessage(error);
}

function isAccountCreationPermissionError(error) {
  if (!error) {
    return false;
  }

  const normalizedCode = String(error.code ?? "").toUpperCase();
  const normalizedMessage = String(error.message ?? "").toLowerCase();

  return (
    error.isForbidden ||
    error.isTotpRequired ||
    normalizedCode.includes("PERMISSION") ||
    normalizedCode.includes("FORBIDDEN") ||
    normalizedCode.includes("ADMIN") ||
    normalizedMessage.includes("permission")
  );
}

export function CustomerAuthPage({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const registrationToastShownRef = useRef(false);

  const redirectTarget = sanitizeCustomerRedirect(
    searchParams.get("redirect"),
    routes.customer.account,
  );
  const signInHref = `${routes.public.login}${buildQueryString({ redirect: redirectTarget })}`;
  const registerHref = `${routes.public.register}${buildQueryString({ redirect: redirectTarget })}`;
  const isRegister = mode === "register";

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    if (auth.isAuthenticated && auth.role === "customer") {
      router.replace(redirectTarget);
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.role, redirectTarget, router]);

  useEffect(() => {
    if (registrationToastShownRef.current) {
      return;
    }

    if (searchParams.get("registered") !== "1") {
      return;
    }

    registrationToastShownRef.current = true;
    toast.success(t("createAccount"), t("accountCreatedSuccessfully"));
  }, [searchParams, t, toast]);

  function updateField(key, value) {
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSignIn(event) {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    startTransition(async () => {
      try {
        await signInWithEmail(form.email.trim(), form.password);
        const session = await auth.refresh();

        if (getSessionRole(session) !== "customer") {
          await auth.logout();
          setErrorMessage(t("pleaseSignInWithCustomerAccount"));
          return;
        }

        toast.success(t("signIn"), t("signedInSuccessfully"));
        router.replace(redirectTarget);
      } catch (error) {
        setErrorMessage(resolveAuthError(error, t));
      }
    });
  }

  function handleRegister(event) {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const passwordErrorKey = getCustomerPasswordError(form.password);

    if (passwordErrorKey) {
      setFieldErrors({ password: t(passwordErrorKey) });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: t("passwordsDoNotMatch") });
      return;
    }

    startTransition(async () => {
      try {
        const result = await signUpWithEmail({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });

        const session = await auth.refresh().catch(() => null);

        if (getSessionRole(session) === "customer") {
          toast.success(t("createAccount"), t("accountCreatedSuccessfully"));
          router.replace(redirectTarget);
          return;
        }

        if (auth.isAuthenticated && auth.role && auth.role !== "customer") {
          await auth.logout().catch(() => {});
        }

        if (result) {
          toast.success(t("createAccount"), t("accountCreatedSuccessfully"));
        }

        router.replace(
          `${routes.public.login}${buildQueryString({
            redirect: redirectTarget,
            registered: 1,
          })}`,
        );
      } catch (error) {
        if (isAccountCreationPermissionError(error)) {
          setErrorMessage(t("accountCreationUnavailable"));
          return;
        }

        setErrorMessage(resolveAuthError(error, t));
      }
    });
  }

  function handleGoogleSignIn() {
    setErrorMessage("");
    setIsGoogleLoading(true);

    try {
      signInWithSocial("google", {
        callbackURL: redirectTarget,
        errorCallbackURL: isRegister ? registerHref : signInHref,
      });
    } catch {
      setIsGoogleLoading(false);
      setErrorMessage(t("googleSignInStartFailed"));
    }
  }

  return (
    <AuthPageShell
      title={isRegister ? t("createYourCustomerAccount") : t("loginToYourAccount")}
      description={isRegister ? t("registerPageDescription") : t("loginPageDescription")}
    >
      <CustomerAuthGuard role={auth.role} t={t} />

      {errorMessage ? (
        <Alert className="mt-6" variant="error" title={isRegister ? t("createAccount") : t("signIn")}>
          {errorMessage}
        </Alert>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={isRegister ? handleRegister : handleSignIn}>
        {isRegister ? (
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t("fullName")}</Label>
            <Input
              id="customer-name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={t("fullName")}
              aria-invalid={fieldErrors.name ? "true" : "false"}
              required
            />
            {fieldErrors.name ? <p className="text-sm text-error">{fieldErrors.name}</p> : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="customer-email">{t("email")}</Label>
          <Input
            id="customer-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="customer@adautoparts.sa"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            required
          />
          {fieldErrors.email ? <p className="text-sm text-error">{fieldErrors.email}</p> : null}
        </div>

        {isRegister ? (
          <div className="space-y-2">
            <Label htmlFor="customer-phone">{t("phone")}</Label>
            <Input
              id="customer-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+966 5X XXX XXXX"
              aria-invalid={fieldErrors.phone ? "true" : "false"}
            />
            {fieldErrors.phone ? <p className="text-sm text-error">{fieldErrors.phone}</p> : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="customer-password">{t("password")}</Label>
          <Input
            id="customer-password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder={t("enterYourPassword")}
            aria-invalid={fieldErrors.password ? "true" : "false"}
            required
          />
          {isRegister ? <p className="text-sm text-muted-foreground">{t("passwordMinLengthHelper")}</p> : null}
          {fieldErrors.password ? <p className="text-sm text-error">{fieldErrors.password}</p> : null}
        </div>

        {isRegister ? (
          <div className="space-y-2">
            <Label htmlFor="customer-confirm-password">{t("confirmPassword")}</Label>
            <Input
              id="customer-confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder={t("confirmPassword")}
              aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
              required
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-sm text-error">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isPending || auth.role === "admin"}>
          {isPending
            ? isRegister
              ? t("creatingAccount")
              : t("signingIn")
            : isRegister
              ? t("createAccount")
              : t("signIn")}
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isRegister ? t("orSignUpWith") : t("orContinueWith")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isPending || auth.role === "admin"}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FcGoogle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{isGoogleLoading ? t("connecting") : t("continueWithGoogle")}</span>
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        {isRegister ? (
          <p className="text-muted-foreground">
            {t("alreadyHaveAnAccount")}{" "}
            <Link href={signInHref} className="font-semibold text-brand-red transition hover:text-brand-red-strong">
              {t("signIn")}
            </Link>
          </p>
        ) : (
          <p className="text-muted-foreground">
            {t("doNotHaveAnAccount")}{" "}
            <Link href={registerHref} className="font-semibold text-brand-red transition hover:text-brand-red-strong">
              {t("signUp")}
            </Link>
          </p>
        )}

        <Link href={routes.public.trackOrder} className="font-medium text-foreground transition hover:text-brand-red">
          {t("trackOrder")}
        </Link>
      </div>
    </AuthPageShell>
  );
}
