"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  buildAdminSettingsPayload,
  getAdminSettings,
  updateAdminSettings,
} from "@/features/admin/settings/admin-settings-api";
import {
  getSettingsTabKeys,
  SettingsForm,
  SettingsFormSkeleton,
} from "@/features/admin/settings/settings-form";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const VALID_TABS = new Set(getSettingsTabKeys());
const URL_FIELDS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "tiktok",
  "linkedin",
  "whatsappLink",
];

function updateSearchParams(current, updates) {
  const params = new URLSearchParams(current);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
}

function getActiveTab(searchParams) {
  const tab = searchParams.get("tab") || "general";
  return VALID_TABS.has(tab) ? tab : "general";
}

function isValidUrl(value) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(form, t) {
  const nextErrors = {};

  if (form.supportEmail && !/\S+@\S+\.\S+/.test(form.supportEmail)) {
    nextErrors.supportEmail = t("invalidEmailAddress");
  }

  URL_FIELDS.forEach((field) => {
    if (!isValidUrl(form[field] || "")) {
      nextErrors[field] = t("invalidUrl");
    }
  });

  return nextErrors;
}

function getPayloadSnapshot(form) {
  return JSON.stringify(buildAdminSettingsPayload(form));
}

export function AdminSettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const toast = useToast();
  const activeTab = getActiveTab(searchParams);
  const [state, setState] = useState({
    loading: true,
    error: null,
    form: null,
    initialForm: null,
    initialSnapshot: "",
    assets: {
      logoUrl: "",
      faviconUrl: "",
    },
    capabilities: {
      canUploadLogo: false,
      canUploadFavicon: false,
      canManageAdminProfile: false,
      canChangePassword: false,
      canEditAdminEmail: false,
    },
    adminProfile: {
      name: "",
      email: "",
      totpStatus: "",
      changePasswordUrl: "",
    },
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const accessState = useMemo(
    () => getAdminAccessState(auth.session),
    [auth.session],
  );
  const isDirty =
    state.form && state.initialSnapshot
      ? getPayloadSnapshot(state.form) !== state.initialSnapshot
      : false;

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    if (!accessState.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return undefined;
    }

    if (accessState.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return undefined;
    }

    if (accessState.totpPending) {
      router.replace(routes.admin.adminTotp);
      return undefined;
    }

    let active = true;

    async function loadPage() {
      try {
        if (active) {
          setState((current) => ({
            ...current,
            loading: true,
            error: null,
          }));
        }

        const result = await getAdminSettings();

        if (active) {
          setState({
            loading: false,
            error: null,
            form: result.form,
            initialForm: result.form,
            initialSnapshot: getPayloadSnapshot(result.form),
            assets: result.assets,
            capabilities: result.capabilities,
            adminProfile: result.adminProfile,
          });
          setFieldErrors({});
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error,
          }));
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [accessState, auth, auth.isLoading, refreshKey, router]);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function replaceTab(tab) {
    const query = updateSearchParams(searchParams.toString(), { tab });
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function updateField(name, value) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        [name]: value,
      },
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSave() {
    if (!state.form || isSubmitting || !isDirty) {
      return;
    }

    const localErrors = validateForm(state.form, t);

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      toast.error(t("failedToUpdateSettings"), t("reviewRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const result = await updateAdminSettings(state.form);
      toast.success(t("settingsUpdatedSuccessfully"), t("settingsSaveSuccessDescription"));
      setState((current) => ({
        ...current,
        form: result.form,
        initialForm: result.form,
        initialSnapshot: getPayloadSnapshot(result.form),
        assets: result.assets,
        capabilities: result.capabilities,
        adminProfile: result.adminProfile,
      }));
    } catch (error) {
      setFieldErrors(error?.fieldErrors ?? {});
      toast.apiError(error, t("failedToUpdateSettings"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function requestDiscard() {
    if (!isDirty) {
      return;
    }

    setDiscardDialogOpen(true);
  }

  function handleDiscard() {
    setState((current) => ({
      ...current,
      form: current.initialForm,
    }));
    setFieldErrors({});
    setDiscardDialogOpen(false);
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("settings")} description={t("adminSettingsDescription")} />
        <SettingsFormSkeleton />
      </div>
    );
  }

  if (state.error || !state.form) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={resolveAdminLoadMessage(state.error, t("adminSettingsLoadError"))}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={t("settings")}
          description={t("adminSettingsDescription")}
        />

        <SettingsForm
          t={t}
          activeTab={activeTab}
          onTabChange={replaceTab}
          form={state.form}
          fieldErrors={fieldErrors}
          capabilities={state.capabilities}
          assets={state.assets}
          adminProfile={state.adminProfile}
          accessState={accessState}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          onFieldChange={updateField}
          onSave={handleSave}
          onDiscard={requestDiscard}
        />
      </div>

      <ConfirmationDialog
        open={discardDialogOpen}
        title={t("discardChanges")}
        description={t("discardSettingsConfirmation")}
        confirmLabel={t("discardChanges")}
        cancelLabel={t("cancel")}
        tone="warning"
        onCancel={() => setDiscardDialogOpen(false)}
        onConfirm={handleDiscard}
      />
    </>
  );
}
