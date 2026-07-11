"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BellIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import {
  getAdminAccessState,
  getAdminDisplayName,
  getAdminSubtitle,
} from "@/features/admin/admin-access";
import { getAdminNotificationPreview } from "@/features/admin/dashboard-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

export function AdminTopbar({ onMenuClick }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.canAccessDashboard) {
      return undefined;
    }

    let active = true;

    async function loadNotificationPreview() {
      try {
        const preview = await getAdminNotificationPreview();

        if (active) {
          setUnreadCount(preview.unreadCount ?? 0);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    loadNotificationPreview();

    return () => {
      active = false;
    };
  }, [auth.isLoading, auth.session]);

  const displayName = getAdminDisplayName(auth.session);
  const subtitle = getAdminSubtitle(auth.session);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-2xl border border-border p-3 text-foreground lg:hidden"
          aria-label={t("openAdminNavigation")}
        >
          <MenuIcon />
        </button>
        <div className="relative hidden max-w-xl flex-1 sm:block">
          <SearchIcon className="pointer-events-none absolute inset-block-start-1/2 inset-inline-end-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchAnything")}
            className="ps-5 pe-12"
            aria-label={t("searchAdminArea")}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href={routes.public.home} className="hidden sm:block">
          <Button variant="outline">
            <ExternalLinkIcon className="size-4" />
            {t("viewStore")}
          </Button>
        </Link>
        <button
          type="button"
          className="relative rounded-2xl border border-border p-3 text-foreground transition hover:bg-muted"
          aria-label={t("recentNotifications")}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span className="absolute -inset-block-start-2 -inset-inline-end-1 flex size-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-semibold text-white">
              {Math.min(unreadCount, 99)}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 transition hover:bg-muted"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
            <UserIcon />
          </div>
          <div className="hidden text-start sm:block">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{subtitle || t("administrator")}</p>
          </div>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </div>
  );
}
