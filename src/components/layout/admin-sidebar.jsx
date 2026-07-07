"use client";

import Link from "next/link";
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
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils/cn";

const adminNavItems = [
  { key: "dashboard", href: routes.admin.adminDashboard, icon: DashboardIcon },
  { key: "products", href: routes.admin.adminProducts, icon: BoxIcon },
  { key: "addProduct", href: routes.admin.adminProductNew, icon: PlusCircleIcon },
  { key: "orders", href: routes.admin.adminOrders, icon: ShoppingCartIcon },
  { key: "categories", href: routes.admin.adminProducts, icon: FolderIcon },
  { key: "brands", href: routes.admin.adminProducts, icon: ShieldIcon },
  { key: "customers", href: routes.admin.adminCustomers, icon: UsersIcon },
  { key: "enquiries", href: routes.admin.adminEnquiries, icon: MessageCircleIcon },
  { key: "settings", href: routes.admin.adminSettings, icon: SettingsIcon },
  { key: "notifications", href: routes.admin.adminNotifications, icon: MessageCircleIcon },
  { key: "auditLogs", href: routes.admin.adminAuditLogs, icon: FileTextIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden w-72 shrink-0 bg-admin-sidebar px-5 py-6 text-white lg:flex lg:flex-col">
      <BrandLogo href={routes.admin.adminDashboard} className="[&_p:first-child]:text-white [&_.text-brand-red]:text-brand-red [&_.text-muted-foreground]:text-white/70" />
      <div className="mt-8 space-y-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

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
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
        >
          <LogOutIcon className="size-5" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
