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
import { PlusCircleIcon, ShieldIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrands,
  getAdminVehicleBrandOptions,
  toggleAdminBrandStatus,
  updateAdminBrand,
} from "@/features/admin/brands/brand-api";
import {
  createAdminVehicleModel,
  deleteAdminVehicleModel,
  getAdminVehicleModels,
  updateAdminVehicleModel,
} from "@/features/admin/brands/vehicle-model-api";
import { getFieldErrors } from "@/lib/api/error-messages";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "newest" },
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
  const tab = searchParams.get("tab");

  return {
    tab: tab === "parts" ? "parts" : "vehicle",
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "newest",
  };
}

function getFieldError(fieldErrors, field) {
  const value = fieldErrors[field];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function createDefaultBrandValues(tab) {
  return {
    id: "",
    name: "",
    slug: "",
    description: "",
    active: true,
    type: tab,
  };
}

function createDefaultModelValues(vehicleBrandId = "") {
  return {
    id: "",
    vehicleBrandId,
    name: "",
    slug: "",
    yearFrom: "",
    yearTo: "",
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

function BrandDrawer({
  open,
  mode,
  formValues,
  fieldErrors,
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
    <Card className="h-fit space-y-5 rounded-[2rem] lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {mode === "edit" ? t("editBrand") : t("addNewBrand")}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("adminBrandDrawerDescription")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField label={t("brandName")} error={getFieldError(fieldErrors, "name")}>
          <Input
            value={formValues.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder={t("brandNamePlaceholder")}
          />
        </FormField>

        <FormField
          label={t("slug")}
          error={getFieldError(fieldErrors, "slug")}
          note={t("brandSlugNote")}
        >
          <Input
            value={formValues.slug}
            onChange={(event) => onChange("slug", event.target.value)}
            placeholder={t("slugPlaceholder")}
          />
        </FormField>

        <FormField label={t("brandType")} error={getFieldError(fieldErrors, "type")}>
          <Select
            value={formValues.type}
            onChange={(event) => onChange("type", event.target.value)}
          >
            <option value="vehicle">{t("vehicleBrands")}</option>
            <option value="parts">{t("partsBrands")}</option>
          </Select>
        </FormField>

        <FormField label={t("description")} error={getFieldError(fieldErrors, "description")}>
          <Textarea
            value={formValues.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder={t("brandDescriptionPlaceholder")}
          />
        </FormField>

        <FormField label={t("logo")} note={t("brandLogoDeferredNote")}>
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("logoUploadDeferred")}
          </div>
        </FormField>

        <FormField label={t("status")} error={getFieldError(fieldErrors, "active")}>
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
            {submitting ? t("saving") : t("saveBrand")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ModelSection({
  available,
  vehicleBrandOptions,
  selectedBrandId,
  models,
  modelFieldErrors,
  modelSubmitting,
  modelValues,
  t,
  onBrandSelect,
  onModelChange,
  onModelSubmit,
  onEditModel,
  onDeleteModel,
}) {
  if (!available) {
    return (
      <Card className="rounded-[2rem]">
        <EmptyState
          icon={ShieldIcon}
          title={t("vehicleModels")}
          description={t("vehicleModelsEmptyBrandDescription")}
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{t("vehicleModels")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("vehicleModelsDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <FormField label={t("vehicleBrand")} error={getFieldError(modelFieldErrors, "vehicleBrandId")}>
          <Select
            value={selectedBrandId}
            onChange={(event) => onBrandSelect(event.target.value)}
          >
            <option value="">{t("selectBrand")}</option>
            {vehicleBrandOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <form className="grid gap-3 rounded-3xl border border-border p-4 lg:grid-cols-6" onSubmit={onModelSubmit}>
          <div className="lg:col-span-2">
            <Label>{t("modelName")}</Label>
            <Input
              value={modelValues.name}
              onChange={(event) => onModelChange("name", event.target.value)}
              placeholder={t("modelNamePlaceholder")}
            />
            {getFieldError(modelFieldErrors, "name") ? (
              <p className="mt-2 text-sm text-error">{getFieldError(modelFieldErrors, "name")}</p>
            ) : null}
          </div>
          <div>
            <Label>{t("slug")}</Label>
            <Input
              value={modelValues.slug}
              onChange={(event) => onModelChange("slug", event.target.value)}
              placeholder={t("slugPlaceholder")}
            />
          </div>
          <div>
            <Label>{t("yearFrom")}</Label>
            <Input
              type="number"
              value={modelValues.yearFrom}
              onChange={(event) => onModelChange("yearFrom", event.target.value)}
            />
          </div>
          <div>
            <Label>{t("yearTo")}</Label>
            <Input
              type="number"
              value={modelValues.yearTo}
              onChange={(event) => onModelChange("yearTo", event.target.value)}
            />
          </div>
          <div>
            <Label>{t("status")}</Label>
            <Select
              value={modelValues.active ? "active" : "inactive"}
              onChange={(event) => onModelChange("active", event.target.value === "active")}
            >
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={modelSubmitting || !selectedBrandId} className="w-full">
              {modelSubmitting ? t("saving") : modelValues.id ? t("editVehicleModel") : t("addVehicleModel")}
            </Button>
          </div>
        </form>
      </div>

      {selectedBrandId ? (
        models.length > 0 ? (
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{model.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {model.slug || "--"}{" "}
                    {model.yearFrom || model.yearTo
                      ? `• ${model.yearFrom || "--"} - ${model.yearTo || "--"}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={model.active ? "success" : "error"}>
                    {model.active ? t("active") : t("inactive")}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => onEditModel(model)}>
                    {t("editVehicleModel")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDeleteModel(model)}>
                    {t("deleteVehicleModel")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldIcon}
            title={t("vehicleModels")}
            description={t("vehicleModelsEmptyDescription")}
          />
        )
      ) : null}
    </Card>
  );
}

function BrandTable({ items, type, t, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-start text-muted-foreground">
            <th className="pb-3">{t("logo")}</th>
            <th className="pb-3">{t("brandName")}</th>
            <th className="pb-3">{t("slug")}</th>
            <th className="pb-3">
              {type === "vehicle" ? t("originCountry") : t("description")}
            </th>
            <th className="pb-3">
              {type === "vehicle" ? t("modelCount") : t("status")}
            </th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/80 align-top last:border-b-0">
              <td className="py-4">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                  {item.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logoUrl} alt={item.name} className="size-full object-contain bg-white p-2" />
                  ) : (
                    <ShieldIcon className="text-muted-foreground" />
                  )}
                </div>
              </td>
              <td className="py-4 font-semibold text-foreground">{item.name}</td>
              <td className="py-4 text-muted-foreground">{item.slug || "--"}</td>
              <td className="py-4 text-muted-foreground">
                {type === "vehicle" ? item.originCountry || "--" : item.description || "--"}
              </td>
              <td className="py-4 text-muted-foreground">
                {type === "vehicle" ? item.modelCount ?? "--" : <Badge variant={item.active ? "success" : "error"}>{item.active ? t("active") : t("inactive")}</Badge>}
              </td>
              <td className="py-4">
                <Badge variant={item.active ? "success" : "error"}>
                  {item.active ? t("active") : t("inactive")}
                </Badge>
              </td>
              <td className="py-4">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                    {t("editBrand")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onToggleStatus(item)}>
                    {item.active ? t("deactivate") : t("activate")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(item)}>
                    {t("deleteBrand")}
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

function BrandCards({ items, t, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {items.map((item) => (
        <Card key={item.id} className="space-y-4 rounded-[2rem]">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {item.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logoUrl} alt={item.name} className="size-full object-contain bg-white p-2" />
              ) : (
                <ShieldIcon className="text-muted-foreground" />
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
                {t("description")}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.description || item.originCountry || "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("modelCount")}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.modelCount ?? "--"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              {t("editBrand")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onToggleStatus(item)}>
              {item.active ? t("deactivate") : t("activate")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(item)}>
              {t("deleteBrand")}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminBrandPage() {
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
    vehicleBrandOptions: [],
    vehicleModels: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerState, setDrawerState] = useState({
    open: false,
    mode: "create",
    values: createDefaultBrandValues(filters.tab),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState({
    open: false,
    type: "",
    item: null,
  });
  const [selectedVehicleBrandId, setSelectedVehicleBrandId] = useState("");
  const [modelValues, setModelValues] = useState(createDefaultModelValues(""));
  const [modelFieldErrors, setModelFieldErrors] = useState({});
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [modelDialogState, setModelDialogState] = useState({ open: false, item: null });

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
        const [brandsResult, vehicleBrandOptions, vehicleModels] = await Promise.all([
          getAdminBrands(filters.tab, filters),
          getAdminVehicleBrandOptions().catch(() => []),
          filters.tab === "vehicle" && selectedVehicleBrandId
            ? getAdminVehicleModels(selectedVehicleBrandId).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: brandsResult.items,
            pagination: brandsResult.pagination,
            vehicleBrandOptions,
            vehicleModels,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
            vehicleBrandOptions: [],
            vehicleModels: [],
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, filters, refreshKey, router, selectedVehicleBrandId]);

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
      values: createDefaultBrandValues(filters.tab),
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
        description: item.description,
        active: item.active,
        type: item.type,
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
        await updateAdminBrand(
          drawerState.values.type,
          drawerState.values.id,
          drawerState.values,
        );
        toast.success(t("brands"), t("brandUpdatedSuccessfully"));
      } else {
        await createAdminBrand(drawerState.values.type, drawerState.values);
        toast.success(t("brands"), t("brandCreatedSuccessfully"));
      }

      setDrawerState({
        open: false,
        mode: "create",
        values: createDefaultBrandValues(filters.tab),
      });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      toast.apiError(error, t("brands"));
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
        await deleteAdminBrand(item.type, item.id);
        toast.success(t("brands"), t("brandDeletedSuccessfully"));
      } else {
        await toggleAdminBrandStatus(item.type, item, type === "activate");
        toast.success(t("brands"), t("brandUpdatedSuccessfully"));
      }

      setDialogState({ open: false, type: "", item: null });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.apiError(error, t("brands"));
    }
  }

  function handleModelChange(field, value) {
    setModelValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleModelSubmit(event) {
    event.preventDefault();

    if (modelSubmitting || !selectedVehicleBrandId) {
      return;
    }

    setModelSubmitting(true);
    setModelFieldErrors({});

    try {
      const payload = {
        ...modelValues,
        vehicleBrandId: selectedVehicleBrandId,
      };

      if (modelValues.id) {
        await updateAdminVehicleModel(modelValues.id, payload);
      } else {
        await createAdminVehicleModel(payload);
      }

      toast.success(t("vehicleModels"), t("vehicleModelCreatedSuccessfully"));
      setModelValues(createDefaultModelValues(selectedVehicleBrandId));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setModelFieldErrors(getFieldErrors(error));
      toast.apiError(error, t("vehicleModels"));
    } finally {
      setModelSubmitting(false);
    }
  }

  async function handleDeleteModel() {
    if (!modelDialogState.item) {
      return;
    }

    try {
      await deleteAdminVehicleModel(modelDialogState.item.id);
      toast.success(t("vehicleModels"), t("vehicleModelDeletedSuccessfully"));
      setModelDialogState({ open: false, item: null });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.apiError(error, t("vehicleModels"));
    }
  }

  const dialogCopy = useMemo(() => {
    if (dialogState.type === "delete") {
      return {
        title: t("deleteBrand"),
        description: t("deleteBrandConfirmation"),
        confirmLabel: t("deleteBrand"),
        tone: "destructive",
      };
    }

    if (dialogState.type === "deactivate") {
      return {
        title: t("deactivateBrand"),
        description: t("deactivateBrandConfirmation"),
        confirmLabel: t("deactivate"),
        tone: "warning",
      };
    }

    return {
      title: t("activateBrand"),
      description: t("activateBrandConfirmation"),
      confirmLabel: t("activate"),
      tone: "warning",
    };
  }, [dialogState.type, t]);

  const currentTabTitle = filters.tab === "vehicle" ? t("vehicleBrands") : t("partsBrands");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("brands")}
        description={t("adminBrandsDescription")}
        action={
          <Button onClick={openCreateDrawer}>
            <PlusCircleIcon className="size-4" />
            {t("addNewBrand")}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="space-y-5 rounded-[2rem]">
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              <Button
                variant={filters.tab === "vehicle" ? "primary" : "outline"}
                onClick={() => replaceFilters({ tab: "vehicle", page: 1 })}
              >
                {t("vehicleBrands")}
              </Button>
              <Button
                variant={filters.tab === "parts" ? "primary" : "outline"}
                onClick={() => replaceFilters({ tab: "parts", page: 1 })}
              >
                {t("partsBrands")}
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_12rem_12rem]">
              <Input
                value={filters.q}
                onChange={(event) => replaceFilters({ q: event.target.value, page: 1 })}
                placeholder={t("searchBrands")}
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
                description={t("adminBrandsLoadError")}
                actionLabel={t("retry")}
                onAction={() => setRefreshKey((value) => value + 1)}
              />
            ) : state.items.length === 0 ? (
              <EmptyState
                icon={ShieldIcon}
                title={currentTabTitle}
                description={t("adminBrandsEmptyDescription")}
                actionLabel={t("addNewBrand")}
                onAction={openCreateDrawer}
              />
            ) : (
              <>
                <BrandTable
                  items={state.items}
                  type={filters.tab}
                  t={t}
                  onEdit={openEditDrawer}
                  onToggleStatus={openStatusDialog}
                  onDelete={openDeleteDialog}
                />
                <BrandCards
                  items={state.items}
                  t={t}
                  onEdit={openEditDrawer}
                  onToggleStatus={openStatusDialog}
                  onDelete={openDeleteDialog}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {state.items.length} {t("ofTotalBrands")}{" "}
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

          {filters.tab === "vehicle" ? (
            <ModelSection
              available={state.vehicleBrandOptions.length > 0}
              vehicleBrandOptions={state.vehicleBrandOptions}
              selectedBrandId={selectedVehicleBrandId}
              models={state.vehicleModels}
              modelFieldErrors={modelFieldErrors}
              modelSubmitting={modelSubmitting}
              modelValues={modelValues}
              t={t}
              onBrandSelect={(brandId) => {
                setSelectedVehicleBrandId(brandId);
                setModelValues(createDefaultModelValues(brandId));
                setModelFieldErrors({});
              }}
              onModelChange={handleModelChange}
              onModelSubmit={handleModelSubmit}
              onEditModel={(model) => {
                setSelectedVehicleBrandId(model.vehicleBrandId);
                setModelValues({
                  id: model.id,
                  vehicleBrandId: model.vehicleBrandId,
                  name: model.name,
                  slug: model.slug,
                  yearFrom: model.yearFrom ?? "",
                  yearTo: model.yearTo ?? "",
                  active: model.active,
                });
                setModelFieldErrors({});
              }}
              onDeleteModel={(model) => setModelDialogState({ open: true, item: model })}
            />
          ) : null}
        </div>

        <BrandDrawer
          open={drawerState.open}
          mode={drawerState.mode}
          formValues={drawerState.values}
          fieldErrors={fieldErrors}
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

      <ConfirmationDialog
        open={modelDialogState.open}
        title={t("deleteVehicleModel")}
        description={t("deleteVehicleModelConfirmation")}
        confirmLabel={t("deleteVehicleModel")}
        tone="destructive"
        onCancel={() => setModelDialogState({ open: false, item: null })}
        onConfirm={handleDeleteModel}
        itemPreview={
          modelDialogState.item ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{modelDialogState.item.name}</p>
              <p className="text-sm text-muted-foreground">{modelDialogState.item.slug || "--"}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
