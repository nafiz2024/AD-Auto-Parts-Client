"use client";

import { apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { requestAdminDashboardRefresh } from "@/features/admin/dashboard-api";
import {
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeItems,
} from "@/features/admin/order-workflow/admin-workflow-utils";

function normalizeNotification(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `notification-${index}`) ?? `notification-${index}`,
    title: firstString(item?.title, item?.subject, item?.type) ?? "Notification",
    message: firstString(item?.message, item?.body, item?.content) ?? "",
    type: firstString(item?.type, item?.category, item?.channel) ?? "general",
    createdAt: firstString(item?.createdAt, item?.sentAt, item?.updatedAt) ?? "",
    read: firstBoolean(item?.read, item?.isRead) ?? false,
  };
}

function normalizeUnreadCount(payload) {
  return (
    firstNumber(
      payload?.unreadCount,
      payload?.count,
      payload?.total,
      payload?.unread,
      payload,
    ) ?? 0
  );
}

async function loadDashboardSummary() {
  const result = await apiGet(endpoints.admin.dashboardSummary, {
    credentials: "include",
  });

  return getEnvelopeData(result);
}

export async function getAdminNotifications() {
  const result = await apiGet(endpoints.admin.notifications, {
    credentials: "include",
  });
  const payload = getEnvelopeData(result);
  const source = payload?.notifications ?? payload;

  return normalizeItems(source).map(normalizeNotification);
}

export async function getAdminUnreadNotificationCount() {
  try {
    const result = await apiGet(endpoints.admin.notificationsUnreadCount, {
      credentials: "include",
    });
    return normalizeUnreadCount(getEnvelopeData(result));
  } catch (error) {
    if (![404, 405].includes(error?.status)) {
      throw error;
    }

    const payload = await loadDashboardSummary();
    return normalizeUnreadCount(payload?.unreadNotifications);
  }
}

export async function markAdminNotificationRead(notificationId) {
  await apiPatch(endpoints.admin.notificationMarkRead(notificationId), undefined, {
    credentials: "include",
  });
  requestAdminDashboardRefresh();
}

export async function markAllAdminNotificationsRead() {
  await apiPatch(endpoints.admin.notificationsReadAll, undefined, {
    credentials: "include",
  });
  requestAdminDashboardRefresh();
}
