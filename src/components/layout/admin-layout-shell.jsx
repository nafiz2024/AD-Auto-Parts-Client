"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

export function AdminLayoutShell({ children }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminSessionChecked, setAdminSessionChecked] = useState(false);
  const access = useMemo(() => getAdminAccessState(auth.session), [auth.session]);
  const guardLoading = auth.isLoading || !adminSessionChecked;

  useEffect(() => {
    if (auth.isLoading || adminSessionChecked) {
      return undefined;
    }

    let active = true;

    auth
      .refresh({ scope: "admin" })
      .catch(() => null)
      .finally(() => {
        if (active) {
          setAdminSessionChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, [adminSessionChecked, auth, auth.isLoading]);

  const redirectTarget = useMemo(() => {
    if (guardLoading) {
      return null;
    }

    if (!access.isAuthenticated || access.forbidden) {
      return routes.admin.adminLogin;
    }

    return null;
  }, [access, guardLoading]);

  useEffect(() => {
    if (!redirectTarget || pathname === redirectTarget) {
      return;
    }

    router.replace(redirectTarget);
  }, [pathname, redirectTarget, router]);

  if (guardLoading || redirectTarget || !access.canAccessDashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white px-6 py-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-foreground">{t("adminRedirecting")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("checkingAdminSession")}</p>
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
