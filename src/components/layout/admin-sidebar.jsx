"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  BoxIcon,
  DashboardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FolderIcon,
  LogOutIcon,
  MessageCircleIcon,
  PlusCircleIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";

const adminNavItems = [
  { key: "dashboard", href: routes.admin.adminDashboard, icon: DashboardIcon },
  { key: "products", href: routes.admin.adminProducts, icon: BoxIcon },
  { key: "addProduct", href: routes.admin.adminProductNew, icon: PlusCircleIcon },
  { key: "orders", href: routes.admin.adminOrders, icon: ShoppingCartIcon },
  { key: "categories", href: routes.admin.adminCategories, icon: FolderIcon },
  { key: "brands", href: routes.admin.adminBrands, icon: ShieldIcon },
  { key: "customers", href: routes.admin.adminCustomers, icon: UsersIcon },
  { key: "enquiries", href: routes.admin.adminEnquiries, icon: MessageCircleIcon },
  { key: "settings", href: routes.admin.adminSettings, icon: SettingsIcon },
  { key: "notifications", href: routes.admin.adminNotifications, icon: MessageCircleIcon },
  { key: "auditLogs", href: routes.admin.adminAuditLogs, icon: FileTextIcon },
];

function isNavActive(pathname, href) {
  if (href === routes.admin.adminDashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await auth.logout();
      toast.success(t("logout"), t("adminSignedOut"));
    } catch (error) {
      toast.apiError(error, t("logout"));
    } finally {
      setIsLoggingOut(false);
      window.location.assign(routes.admin.adminLogin);
    }
  }

  return (
    <aside className="hidden w-72 shrink-0 bg-admin-sidebar px-5 py-6 text-white lg:flex lg:flex-col">
      <BrandLogo
        href={routes.admin.adminDashboard}
        className="[&_p:first-child]:text-white [&_.text-brand-red]:text-brand-red [&_.text-muted-foreground]:text-white/70"
      />
      <div className="mt-8 space-y-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-[linear-gradient(135deg,#ef4444,#f96048)] text-white shadow-lg shadow-brand-red/20"
                  : "text-white/80 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-5" />
              {t(item.key)}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto space-y-2 border-t border-white/10 pt-6">
        <Link
          href={routes.public.home}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
        >
          <ExternalLinkIcon className="size-5" />
          {t("viewStore")}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
        >
          <LogOutIcon className="size-5" />
          {isLoggingOut ? t("loggingOut") : t("logout")}
        </button>
      </div>
    </aside>
  );
}
