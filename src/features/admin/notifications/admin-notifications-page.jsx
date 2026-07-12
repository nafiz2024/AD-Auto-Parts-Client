"use client";

import { useEffect, useMemo, useState } from "react";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BellIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/features/admin/notifications/admin-notifications-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(value, locale) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTypeVariant(type) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("error") || normalized.includes("alert")) {
    return "error";
  }

  if (normalized.includes("warn") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("success") || normalized.includes("complete")) {
    return "success";
  }

  return "info";
}

export function AdminNotificationsPage() {
  const auth = useAuth();
  const toast = useToast();
  const { t, locale } = useLanguage();
  const [state, setState] = useState({
    loading: true,
    error: null,
    notifications: [],
    unreadCount: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState("");
  const access = useMemo(() => getAdminAccessState(auth.session), [auth.session]);

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    if (!access.canAccessDashboard) {
      return undefined;
    }

    let active = true;

    async function loadPage() {
      try {
        if (active) {
          setState((current) => ({ ...current, loading: true, error: null }));
        }

        const [notifications, unreadCount] = await Promise.all([
          getAdminNotifications(),
          getAdminUnreadNotificationCount(),
        ]);

        if (active) {
          setState({
            loading: false,
            error: null,
            notifications,
            unreadCount,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            notifications: [],
            unreadCount: 0,
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [access.canAccessDashboard, auth.isLoading, refreshKey]);

  async function handleMarkRead(notification) {
    if (!notification || notification.read || activeNotificationId) {
      return;
    }

    setActiveNotificationId(notification.id);

    try {
      await markAdminNotificationRead(notification.id);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      toast.apiError(error, t("notifications"));
    } finally {
      setActiveNotificationId("");
    }
  }

  async function handleMarkAllRead() {
    if (isMarkingAll || state.unreadCount === 0) {
      return;
    }

    setIsMarkingAll(true);

    try {
      await markAllAdminNotificationsRead();
      setRefreshKey((current) => current + 1);
    } catch (error) {
      toast.apiError(error, t("notifications"));
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("notifications")} description={t("recentNotifications")} />
        <TableRowSkeleton rows={6} />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={resolveAdminLoadMessage(state.error, t("failedToLoadDescription"))}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((current) => current + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("notifications")}
        description={t("recentNotifications")}
        action={
          <Button
            variant="outline"
            disabled={isMarkingAll || state.unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            {isMarkingAll ? t("loading") : "Mark all as read"}
          </Button>
        }
      />

      <Card className="space-y-5 rounded-[2rem]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">
            {state.unreadCount} unread
          </p>
          <Badge variant={state.unreadCount > 0 ? "info" : "neutral"}>
            {state.unreadCount > 0 ? t("statusUnread") : t("statusRead")}
          </Badge>
        </div>

        {state.notifications.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={t("notifications")}
            description="No notifications yet."
          />
        ) : (
          <div className="space-y-4">
            {state.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-[1.75rem] border p-5 ${
                  notification.read ? "border-border bg-white" : "border-brand-red/20 bg-brand-red/5"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{notification.title}</p>
                      <Badge variant={getTypeVariant(notification.type)}>{notification.type}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{notification.message}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={notification.read ? "neutral" : "info"}>
                      {notification.read ? t("statusRead") : t("statusUnread")}
                    </Badge>
                    {!notification.read ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeNotificationId === notification.id}
                        onClick={() => handleMarkRead(notification)}
                      >
                        {activeNotificationId === notification.id ? t("loading") : "Mark as read"}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {formatDateTime(notification.createdAt, locale)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
