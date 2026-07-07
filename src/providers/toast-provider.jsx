"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/error-messages";

const ToastContext = createContext(null);

let toastId = 0;

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: "border-l-success bg-white",
    info: "border-l-blue-500 bg-white",
    warning: "border-l-warning bg-white",
    error: "border-l-error bg-white",
    neutral: "border-l-slate-400 bg-white",
  };

  return (
    <div
      className={`pointer-events-auto w-full max-w-md rounded-3xl border border-border/70 ${styles[toast.variant] ?? styles.neutral} border-l-4 px-5 py-4 shadow-soft`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{toast.title}</p>
          {toast.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ title, description, variant = "neutral", duration = 5000 }) => {
    const id = ++toastId;
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, title, description, variant },
    ]);

    window.setTimeout(() => dismissToast(id), duration);
    return id;
  }, [dismissToast]);

  const value = useMemo(
    () => ({
      showToast,
      success: (title, description) => showToast({ title, description, variant: "success" }),
      info: (title, description) => showToast({ title, description, variant: "info" }),
      warning: (title, description) =>
        showToast({ title, description, variant: "warning" }),
      error: (title, description) => showToast({ title, description, variant: "error" }),
      apiError: (error, title = "Something went wrong") =>
        showToast({
          title,
          description: getErrorMessage(error),
          variant: "error",
        }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-block-start-5 inset-inline-end-4 z-50 flex w-full max-w-lg flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider.");
  }

  return context;
}
