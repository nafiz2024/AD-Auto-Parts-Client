"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FolderIcon, PlusCircleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  getAdminCategoryOptions,
  toggleAdminCategoryStatus,
  updateAdminCategory,
} from "@/features/admin/categories/category-api";
import { getFieldErrors } from "@/lib/api/error-messages";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const SORT_OPTIONS = [
  { value: "oldest", labelKey: "oldest" },
  { value: "name_asc", labelKey: "nameAscending" },
];

function updateSearchParams(current, updates) {
  const params = new URLSearchParams(current);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
}

function buildFilters(searchParamsValue) {
  const searchParams = new URLSearchParams(searchParamsValue);

  return {
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "",
  };
}

function getFieldError(fieldErrors, field) {
  const value = fieldErrors[field];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function createDefaultFormValues() {
  return {
    id: "",
    name: "",
    slug: "",
    parentCategoryId: "",
    description: "",
    displayOrder: "",
    active: true,
  };
}

function FormField({ label, error, children, note }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

function CategoryDrawer({
  open,
  mode,
  formValues,
  fieldErrors,
  parentOptions,
  submitting,
  t,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  return (
    <Card className="w-full max-w-none space-y-5 rounded-[2rem]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {mode === "edit" ? t("editCategory") : t("addNewCategory")}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("adminCategoryDrawerDescription")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField label={t("categoryName")} error={getFieldError(fieldErrors, "name")}>
          <Input
            value={formValues.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder={t("categoryNamePlaceholder")}
          />
        </FormField>

        <FormField
          label={t("slug")}
          error={getFieldError(fieldErrors, "slug")}
          note={t("categorySlugNote")}
        >
          <Input
            value={formValues.slug}
            onChange={(event) => onChange("slug", event.target.value)}
            placeholder={t("slugPlaceholder")}
          />
        </FormField>

        <FormField
          label={t("parentCategory")}
          error={getFieldError(fieldErrors, "parentCategoryId")}
          note={t("optionalField")}
        >
          <Select
            value={formValues.parentCategoryId}
            onChange={(event) => onChange("parentCategoryId", event.target.value)}
          >
            <option value="">{t("selectParentCategory")}</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label={t("description")}
          error={getFieldError(fieldErrors, "description")}
        >
          <Textarea
            value={formValues.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder={t("categoryDescriptionPlaceholder")}
          />
        </FormField>

        <FormField
          label={t("image")}
          note={t("categoryImageDeferredNote")}
        >
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("imageUploadDeferred")}
          </div>
        </FormField>

        <FormField
          label={t("displayOrder")}
          error={getFieldError(fieldErrors, "displayOrder")}
          note={t("displayOrderHint")}
        >
          <Input
            type="number"
            min="0"
            value={formValues.displayOrder}
            onChange={(event) => onChange("displayOrder", event.target.value)}
          />
        </FormField>

        <FormField
          label={t("status")}
          error={getFieldError(fieldErrors, "active")}
        >
          <Select
            value={formValues.active ? "active" : "inactive"}
            onChange={(event) => onChange("active", event.target.value === "active")}
          >
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </Select>
        </FormField>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("saving") : t("saveCategory")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CategoryTable({ items, t, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="hidden w-full overflow-x-auto lg:block">
      <table className="min-w-[1120px] w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[9%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col className="w-[9%]" />
          <col className="w-[10%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-start text-muted-foreground">
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("image")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("categoryName")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("slug")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("parentCategory")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("productCount")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("status")}</th>
            <th className="pb-3 pe-4 text-xs font-semibold uppercase tracking-[0.16em]">{t("displayOrder")}</th>
            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.16em]">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/80 align-middle last:border-b-0">
              <td className="py-3 pe-4 align-middle">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                  ) : (
                    <FolderIcon className="text-muted-foreground" />
                  )}
                </div>
              </td>
              <td className="py-3 pe-4 align-middle font-semibold text-foreground">
                <span className="block truncate">{item.name}</span>
              </td>
              <td className="py-3 pe-4 align-middle text-muted-foreground">
                <span className="block truncate">{item.slug || "--"}</span>
              </td>
              <td className="py-3 pe-4 align-middle text-muted-foreground">
                <span className="block truncate">{item.parentCategoryName || "--"}</span>
              </td>
              <td className="py-3 pe-4 align-middle text-muted-foreground">{item.productCount ?? "--"}</td>
              <td className="py-3 pe-4 align-middle">
                <Badge variant={item.active ? "success" : "error"}>
                  {item.active ? t("active") : t("inactive")}
                </Badge>
              </td>
              <td className="py-3 pe-4 align-middle text-muted-foreground">{item.displayOrder ?? "--"}</td>
              <td className="py-3 align-middle">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => onEdit(item)}>
                    {t("editCategory")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={() => onToggleStatus(item)}
                  >
                    {item.active ? t("deactivate") : t("activate")}
                  </Button>
                  <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => onDelete(item)}>
                    {t("deleteCategory")}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryCards({ items, t, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {items.map((item) => (
        <Card key={item.id} className="space-y-4 rounded-[2rem]">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
              ) : (
                <FolderIcon className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.slug || "--"}</p>
              <Badge variant={item.active ? "success" : "error"}>
                {item.active ? t("active") : t("inactive")}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("parentCategory")}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.parentCategoryName || "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("productCount")}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.productCount ?? "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("displayOrder")}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.displayOrder ?? "--"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              {t("editCategory")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onToggleStatus(item)}>
              {item.active ? t("deactivate") : t("activate")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(item)}>
              {t("deleteCategory")}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminCategoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useLanguage();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => buildFilters(searchKey), [searchKey]);
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    pagination: null,
    parentOptions: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerState, setDrawerState] = useState({
    open: false,
    mode: "create",
    values: createDefaultFormValues(),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState({
    open: false,
    type: "",
    item: null,
  });

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return undefined;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return undefined;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return undefined;
    }

    let active = true;

    async function loadPage() {
      try {
        const [categoriesResult, parentOptions] = await Promise.all([
          getAdminCategories(filters),
          getAdminCategoryOptions().catch(() => []),
        ]);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: categoriesResult.items,
            pagination: categoriesResult.pagination,
            parentOptions,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
            parentOptions: [],
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, filters, refreshKey, router]);

  function replaceFilters(updates) {
    const query = updateSearchParams(searchParams.toString(), updates);
    const nextHref = query ? `${pathname}?${query}` : pathname;
    const currentHref = searchKey ? `${pathname}?${searchKey}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref);
    }
  }

  function openCreateDrawer() {
    setFieldErrors({});
    setDrawerState({
      open: true,
      mode: "create",
      values: createDefaultFormValues(),
    });
  }

  function openEditDrawer(item) {
    setFieldErrors({});
    setDrawerState({
      open: true,
      mode: "edit",
      values: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        parentCategoryId: item.parentCategoryId,
        description: item.description,
        displayOrder: item.displayOrder ?? "",
        active: item.active,
      },
    });
  }

  function closeDrawer() {
    if (submitting) {
      return;
    }

    setFieldErrors({});
    setDrawerState((current) => ({ ...current, open: false }));
  }

  function handleFormChange(field, value) {
    setDrawerState((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      if (drawerState.mode === "edit" && drawerState.values.id) {
        await updateAdminCategory(drawerState.values.id, drawerState.values);
        toast.success(t("categories"), t("categoryUpdatedSuccessfully"));
      } else {
        await createAdminCategory(drawerState.values);
        toast.success(t("categories"), t("categoryCreatedSuccessfully"));
      }

      setDrawerState({
        open: false,
        mode: "create",
        values: createDefaultFormValues(),
      });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      toast.apiError(error, t("categories"));
    } finally {
      setSubmitting(false);
    }
  }

  function openStatusDialog(item) {
    setDialogState({
      open: true,
      type: item.active ? "deactivate" : "activate",
      item,
    });
  }

  function openDeleteDialog(item) {
    setDialogState({
      open: true,
      type: "delete",
      item,
    });
  }

  async function handleConfirmDialog() {
    const { item, type } = dialogState;

    if (!item || !type) {
      return;
    }

    try {
      if (type === "delete") {
        await deleteAdminCategory(item.id);
        toast.success(t("categories"), t("categoryDeletedSuccessfully"));
      } else {
        await toggleAdminCategoryStatus(item, type === "activate");
        toast.success(t("categories"), t("categoryUpdatedSuccessfully"));
      }

      setDialogState({ open: false, type: "", item: null });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.apiError(error, t("categories"));
    }
  }

  const dialogCopy = useMemo(() => {
    if (dialogState.type === "delete") {
      return {
        title: t("deleteCategory"),
        description: t("deleteCategoryConfirmation"),
        confirmLabel: t("deleteCategory"),
        tone: "destructive",
      };
    }

    if (dialogState.type === "deactivate") {
      return {
        title: t("deactivateCategory"),
        description: t("deactivateCategoryConfirmation"),
        confirmLabel: t("deactivate"),
        tone: "warning",
      };
    }

    return {
      title: t("activateCategory"),
      description: t("activateCategoryConfirmation"),
      confirmLabel: t("activate"),
      tone: "warning",
    };
  }, [dialogState.type, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("categories")}
        description={t("adminCategoriesDescription")}
        action={
          <Button onClick={openCreateDrawer}>
            <PlusCircleIcon className="size-4" />
            {t("addNewCategory")}
          </Button>
        }
      />

      <div className="w-full max-w-none space-y-6">
        <Card className="w-full max-w-none space-y-5 rounded-[2rem]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_12rem_12rem]">
            <Input
              value={filters.q}
              onChange={(event) => replaceFilters({ q: event.target.value, page: 1 })}
              placeholder={t("searchCategories")}
              className="sm:col-span-2 xl:col-span-1"
            />
            <Select
              value={filters.status}
              onChange={(event) => replaceFilters({ status: event.target.value, page: 1 })}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </Select>
            <Select
              value={filters.sort}
              onChange={(event) => replaceFilters({ sort: event.target.value, page: 1 })}
            >
              <option value="">{t("newest")}</option>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>

          {state.loading ? (
            <TableRowSkeleton rows={6} />
          ) : state.error ? (
            <ErrorState
              title={t("failedToLoad")}
              description={resolveAdminLoadMessage(state.error, t("adminCategoriesLoadError"))}
              actionLabel={t("retry")}
              onAction={() => setRefreshKey((value) => value + 1)}
            />
          ) : state.items.length === 0 ? (
            <EmptyState
              icon={FolderIcon}
              title={t("categories")}
              description={t("adminCategoriesEmptyDescription")}
              actionLabel={t("addNewCategory")}
              onAction={openCreateDrawer}
            />
          ) : (
            <>
              <div className="w-full overflow-hidden">
              <CategoryTable
                items={state.items}
                t={t}
                onEdit={openEditDrawer}
                onToggleStatus={openStatusDialog}
                onDelete={openDeleteDialog}
              />
              </div>
              <CategoryCards
                items={state.items}
                t={t}
                onEdit={openEditDrawer}
                onToggleStatus={openStatusDialog}
                onDelete={openDeleteDialog}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("showing")} {state.items.length} {t("ofTotalCategories")}{" "}
                  {state.pagination?.total ?? state.items.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!state.pagination?.hasPreviousPage}
                    onClick={() => replaceFilters({ page: Math.max(filters.page - 1, 1) })}
                  >
                    {t("previous")}
                  </Button>
                  <span className="min-w-20 text-center text-sm text-muted-foreground">
                    {state.pagination?.page ?? 1} / {state.pagination?.totalPages ?? 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!state.pagination?.hasNextPage}
                    onClick={() => replaceFilters({ page: filters.page + 1 })}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <CategoryDrawer
          open={drawerState.open}
          mode={drawerState.mode}
          formValues={drawerState.values}
          fieldErrors={fieldErrors}
          parentOptions={state.parentOptions.filter((option) => option.id !== drawerState.values.id)}
          submitting={submitting}
          t={t}
          onClose={closeDrawer}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </div>

      <ConfirmationDialog
        open={dialogState.open}
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.confirmLabel}
        tone={dialogCopy.tone}
        onCancel={() => setDialogState({ open: false, type: "", item: null })}
        onConfirm={handleConfirmDialog}
        itemPreview={
          dialogState.item ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{dialogState.item.name}</p>
              <p className="text-sm text-muted-foreground">{dialogState.item.slug || "--"}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
