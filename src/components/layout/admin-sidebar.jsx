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
  TruckIcon,
  UsersIcon,
  XIcon,
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
  { key: "invoices", href: routes.admin.adminInvoices, icon: FileTextIcon },
  { key: "shipments", href: routes.admin.adminShipments, icon: TruckIcon },
  { key: "categories", href: routes.admin.adminCategories, icon: FolderIcon },
  { key: "brands", href: routes.admin.adminBrands, icon: ShieldIcon },
  { key: "customers", href: routes.admin.adminCustomers, icon: UsersIcon },
  { key: "reviews", href: routes.admin.adminReviews, icon: FileTextIcon },
  { key: "productQuestions", href: routes.admin.adminQuestions, icon: MessageCircleIcon },
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

export function AdminSidebar({ mobileOpen = false, onClose }) {
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
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-brand-navy/45 transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 inset-inline-start-0 z-50 flex h-dvh w-[min(20rem,calc(100vw-1.5rem))] shrink-0 flex-col overflow-hidden bg-admin-sidebar px-5 py-6 text-white shadow-soft transition lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:opacity-100 lg:shadow-none",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto",
        )}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <BrandLogo
            variant="admin"
            href={routes.admin.adminDashboard}
            compact
            imageClassName="max-w-[13.5rem]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/8 hover:text-white"
            aria-label={t("closeNavigationMenu")}
          >
            <XIcon />
          </button>
        </div>
        <BrandLogo
          variant="admin"
          href={routes.admin.adminDashboard}
          className="hidden lg:inline-flex"
          imageClassName="max-w-[14rem]"
        />
        <div className="mt-8 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pe-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
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
            onClick={onClose}
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
    </>
  );
}
