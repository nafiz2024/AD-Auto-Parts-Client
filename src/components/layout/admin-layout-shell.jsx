"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

export function AdminLayoutShell({ children }) {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      router.replace(routes.admin.adminLogin);
      return;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
    }
  }, [auth.isLoading, auth.session, router]);

  const access = getAdminAccessState(auth.session);

  if (auth.isLoading || !access.canAccessDashboard) {
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
    <div className="flex min-h-screen overflow-x-clip bg-[#f8fafc]">
      <AdminSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
