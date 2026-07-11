"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { getErrorMessage } from "@/lib/api/error-messages";

export function AdminLayoutShell({ children }) {
  const { refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminAuthStatus, setAdminAuthStatus] = useState("checking");
  const [guardError, setGuardError] = useState("");
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function verifyAdminSession() {
      try {
        const session = await refresh({ scope: "admin" });

        if (!active) {
          return;
        }

        const access = getAdminAccessState(session);
        setAdminAuthStatus(access.canAccessDashboard ? "authenticated" : "unauthenticated");
        setGuardError("");
      } catch (error) {
        if (!active) {
          return;
        }

        setAdminAuthStatus("unauthenticated");
        setGuardError(error?.status === 401 ? "" : getErrorMessage(error));
      }
    }

    verifyAdminSession();

    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (adminAuthStatus !== "unauthenticated" || pathname === routes.admin.adminLogin) {
      return;
    }

    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    router.replace(routes.admin.adminLogin);
  }, [adminAuthStatus, pathname, router]);

  if (adminAuthStatus !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white px-6 py-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-foreground">{t("adminRedirecting")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("checkingAdminSession")}</p>
          {guardError ? <p className="mt-4 text-sm text-error">{guardError}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <AdminSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
