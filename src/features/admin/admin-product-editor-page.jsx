"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoadingState, UploadProgress } from "@/components/states/loading-states";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BoxIcon, TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminProduct,
  deleteAdminProductMedia,
  getAdminCatalogOptions,
  getAdminProductDetail,
  reorderAdminProductMedia,
  runAdminProductAction,
  setPrimaryAdminProductMedia,
  updateAdminProduct,
  uploadAdminProductMedia,
} from "@/features/admin/product-admin-api";
import { getFieldErrors } from "@/lib/api/error-messages";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function createCompatibilityRow() {
  return {
    id: `compatibility-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    vehicleBrandId: "",
    vehicleModelId: "",
    yearFrom: "",
    yearTo: "",
    engine: "",
    engineCode: "",
    position: "",
  };
}

function createEmptyFormValues() {
  return {
    name: "",
    slug: "",
    sku: "",
    oemNumber: "",
    partNumber: "",
    categoryId: "",
    subcategoryId: "",
    partsBrandId: "",
    shortDescription: "",
    description: "",
    specifications: "",
    condition: "used",
    conditionScore: "",
    testedStatus: "",
    knownDefects: "",
    warrantyDays: "",
    returnEligible: false,
    priceSar: "",
    comparePriceSar: "",
    stockQuantity: "",
    lowStockThreshold: "",
    inventoryStatus: "in_stock",
    visibilityStatus: "draft",
    featured: false,
    compatibility: [createCompatibilityRow()],
  };
}

function minorToSarInput(amountMinor) {
  if (amountMinor === null || amountMinor === undefined || Number.isNaN(Number(amountMinor))) {
    return "";
  }

  return (Number(amountMinor) / 100).toFixed(2);
}

function hydrateFormValues(product) {
  const values = createEmptyFormValues();

  return {
    ...values,
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    oemNumber: product.oemNumber ?? "",
    partNumber: product.partNumber ?? "",
    categoryId: product.categoryId ?? "",
    subcategoryId: product.subcategoryId ?? "",
    partsBrandId: product.partsBrandId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    specifications: product.specifications ?? "",
    condition: product.condition ?? "used",
    conditionScore: product.conditionScore === "" ? "" : String(product.conditionScore ?? ""),
    testedStatus: product.testedStatus ?? "",
    knownDefects: product.knownDefects ?? "",
    warrantyDays: product.warrantyDays === "" ? "" : String(product.warrantyDays ?? ""),
    returnEligible: Boolean(product.returnEligible),
    priceSar: minorToSarInput(product.priceMinor),
    comparePriceSar: minorToSarInput(product.compareAtPriceMinor),
    stockQuantity: product.stockQuantity === null ? "" : String(product.stockQuantity ?? ""),
    lowStockThreshold:
      product.lowStockThreshold === "" ? "" : String(product.lowStockThreshold ?? ""),
    inventoryStatus: product.inventoryStatus ?? "in_stock",
    visibilityStatus: product.visibilityStatus ?? "draft",
    featured: Boolean(product.featured),
    compatibility:
      product.compatibility && product.compatibility.length > 0
        ? product.compatibility.map((entry, index) => ({
            id: entry.id ?? `compatibility-${index}`,
            vehicleBrandId: entry.vehicleBrandId ?? "",
            vehicleModelId: entry.vehicleModelId ?? "",
            yearFrom: entry.yearFrom === "" ? "" : String(entry.yearFrom ?? ""),
            yearTo: entry.yearTo === "" ? "" : String(entry.yearTo ?? ""),
            engine: entry.engine ?? "",
            engineCode: entry.engineCode ?? "",
            position: entry.position ?? "",
          }))
        : [createCompatibilityRow()],
  };
}

function Field({ label, required = false, error, children }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-brand-red"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}

function SectionCard({ number, title, children }) {
  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white">
          {number}
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function ProductPreview({ formValues, product, t }) {
  return (
    <Card className="space-y-5 rounded-[2rem] xl:sticky xl:top-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("productPreview")}</h2>
        <Badge variant="info">{formValues.condition || t("usedCondition")}</Badge>
      </div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-border bg-muted">
        {product?.media?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.media[0].url} alt={formValues.name || t("productName")} className="size-full object-cover" />
        ) : (
          <BoxIcon className="size-20 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">{formValues.name || t("productName")}</h3>
        {formValues.priceSar ? (
          <PriceDisplay amountMinor={Math.round(Number.parseFloat(formValues.priceSar || "0") * 100)} />
        ) : (
          <p className="text-lg text-muted-foreground">{t("pricePreviewHint")}</p>
        )}
      </div>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t("sku")}</span>
          <span className="font-medium text-foreground">{formValues.sku || "--"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t("category")}</span>
          <span className="font-medium text-foreground">{formValues.categoryId || "--"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t("stockQuantity")}</span>
          <span className="font-medium text-foreground">{formValues.stockQuantity || "--"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t("status")}</span>
          <Badge variant="warning">{formValues.visibilityStatus || "draft"}</Badge>
        </div>
      </div>
      {formValues.shortDescription ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">{t("shortDescription")}</p>
          <p className="text-sm leading-6 text-muted-foreground">{formValues.shortDescription}</p>
        </div>
      ) : null}
    </Card>
  );
}

function ProductMediaManager({
  productId,
  media,
  onMediaChange,
  t,
  toast,
}) {
  const [uploadItems, setUploadItems] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function handleFilesSelected(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));

    if (invalidFile) {
      toast.error(t("failedToUploadImage"), t("allowedImageTypesHint"));
      return;
    }

    const previewItems = files.map((file) => ({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 65,
      status: "uploading",
    }));

    setUploadItems(previewItems);

    try {
      await uploadAdminProductMedia(productId, files);
      toast.success(t("imageUploadedSuccessfully"), t("productMediaUpdated"));
      setUploadItems(previewItems.map((item) => ({ ...item, progress: 100, status: "done" })));
      onMediaChange();
    } catch (error) {
      setUploadItems([]);
      toast.apiError(error, t("failedToUploadImage"));
    }
  }

  async function handleSetPrimary(mediaId) {
    try {
      await setPrimaryAdminProductMedia(productId, mediaId);
      toast.success(t("setPrimary"), t("productMediaUpdated"));
      onMediaChange();
    } catch (error) {
      toast.apiError(error, t("setPrimary"));
    }
  }

  async function handleDeleteMedia() {
    try {
      await deleteAdminProductMedia(productId, pendingDelete.id);
      toast.success(t("deleteImage"), t("productMediaUpdated"));
      setPendingDelete(null);
      onMediaChange();
    } catch (error) {
      toast.apiError(error, t("deleteImage"));
    }
  }

  async function moveMedia(mediaId, direction) {
    const currentIndex = media.findIndex((entry) => entry.id === mediaId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= media.length) {
      return;
    }

    const nextMedia = [...media];
    const [moved] = nextMedia.splice(currentIndex, 1);
    nextMedia.splice(targetIndex, 0, moved);

    try {
      await reorderAdminProductMedia(productId, nextMedia.map((entry) => entry.id));
      toast.success(t("reorderImages"), t("productMediaUpdated"));
      onMediaChange();
    } catch (error) {
      toast.apiError(error, t("reorderImages"));
    }
  }

  return (
    <SectionCard number={2} title={t("uploadImages")}>
      <div className="grid gap-5 xl:grid-cols-[0.34fr_0.66fr]">
        <div className="rounded-[2rem] border border-dashed border-border bg-muted/40 p-5">
          <Label htmlFor="product-media-upload" className="mb-3 block">
            {t("uploadImages")}
          </Label>
          <input
            id="product-media-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleFilesSelected}
            className="block w-full text-sm text-muted-foreground file:me-4 file:rounded-2xl file:border-0 file:bg-brand-red file:px-4 file:py-3 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-3 text-xs leading-6 text-muted-foreground">{t("allowedImageTypesHint")}</p>
        </div>
        <div className="space-y-4">
          {media.length === 0 ? (
            <EmptyState
              title={t("uploadImages")}
              description={t("adminNoMediaDescription")}
              actionLabel={null}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {media.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-[2rem] border border-border p-3">
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt} className="aspect-square w-full object-cover" />
                    {item.isPrimary ? (
                      <span className="absolute inset-inline-start-2 inset-block-start-2 rounded-full bg-brand-red px-2 py-1 text-xs font-semibold text-white">
                        {t("setPrimary")}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.isPrimary}
                      onClick={() => handleSetPrimary(item.id)}
                    >
                      {t("setPrimary")}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={index === 0}
                        onClick={() => moveMedia(item.id, "left")}
                        className="flex-1"
                      >
                        {t("moveLeft")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={index === media.length - 1}
                        onClick={() => moveMedia(item.id, "right")}
                        className="flex-1"
                      >
                        {t("moveRight")}
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPendingDelete(item)}>
                      <TrashIcon className="size-4" />
                      {t("deleteImage")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadItems.length > 0 ? <UploadProgress items={uploadItems} /> : null}
        </div>
      </div>

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title={t("deleteImage")}
        description={t("deleteImageConfirmation")}
        confirmLabel={t("deleteImage")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteMedia}
        itemPreview={
          pendingDelete ? (
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingDelete.url} alt={pendingDelete.alt} className="size-full object-cover" />
              </div>
              <p className="font-medium text-foreground">{pendingDelete.alt}</p>
            </div>
          ) : null
        }
      />
    </SectionCard>
  );
}

export function AdminProductEditorPage({ mode, productId = "" }) {
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState({
    loading: mode === "edit",
    error: null,
    catalogs: {
      categories: [],
      vehicleBrands: [],
      vehicleModels: [],
      partsBrands: [],
    },
    product: null,
  });
  const [formValues, setFormValues] = useState(createEmptyFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, action: "" });

  function getActionDialogCopy(action) {
    if (action === "publish") {
      return {
        title: t("publish"),
        description: t("publishProductConfirmation"),
        confirmLabel: t("publish"),
      };
    }

    if (action === "unpublish") {
      return {
        title: t("unpublishProduct"),
        description: t("unpublishProductConfirmation"),
        confirmLabel: t("unpublishProduct"),
      };
    }

    if (action === "archive") {
      return {
        title: t("archive"),
        description: t("archiveProductConfirmation"),
        confirmLabel: t("archive"),
      };
    }

    return {
      title: t("markAsSold"),
      description: t("markAsSoldConfirmation"),
      confirmLabel: t("markAsSold"),
    };
  }

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
        const catalogs = await getAdminCatalogOptions();
        const product = mode === "edit" ? await getAdminProductDetail(productId) : null;

        if (active) {
          setState({
            loading: false,
            error: null,
            catalogs,
            product,
          });

          if (product) {
            setFormValues(hydrateFormValues(product));
          }
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            catalogs: {
              categories: [],
              vehicleBrands: [],
              vehicleModels: [],
              partsBrands: [],
            },
            product: null,
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, mode, productId, router]);

  function getFieldError(name) {
    const value = fieldErrors[name];
    return Array.isArray(value) ? value[0] : value || "";
  }

  function setValue(key, value) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCompatibilityRow(rowId, key, value) {
    setFormValues((current) => ({
      ...current,
      compatibility: current.compatibility.map((entry) =>
        entry.id === rowId
          ? {
              ...entry,
              [key]: value,
              ...(key === "vehicleBrandId" ? { vehicleModelId: "" } : {}),
            }
          : entry,
      ),
    }));
  }

  function addCompatibilityRow() {
    setFormValues((current) => ({
      ...current,
      compatibility: [...current.compatibility, createCompatibilityRow()],
    }));
  }

  function removeCompatibilityRow(rowId) {
    setFormValues((current) => ({
      ...current,
      compatibility:
        current.compatibility.length === 1
          ? current.compatibility
          : current.compatibility.filter((entry) => entry.id !== rowId),
    }));
  }

  async function reloadProduct() {
    if (mode !== "edit") {
      return;
    }

    try {
      const product = await getAdminProductDetail(productId);
      setState((current) => ({
        ...current,
        product,
      }));
      setFormValues(hydrateFormValues(product));
    } catch (error) {
      toast.apiError(error, t("products"));
    }
  }

  async function handleSubmit(nextStatus = "") {
    setSubmitting(true);
    setFieldErrors({});

    try {
      const payload = nextStatus
        ? { ...formValues, visibilityStatus: nextStatus }
        : formValues;
      const result =
        mode === "edit"
          ? await updateAdminProduct(productId, payload)
          : await createAdminProduct(payload);

      const nextProductId = result?.id ?? productId;
      toast.success(
        mode === "edit" ? t("productUpdatedSuccessfully") : t("productCreatedSuccessfully"),
        mode === "edit" ? t("productSaveSuccessDescription") : t("productCreateSuccessDescription"),
      );

      if (mode === "edit") {
        await reloadProduct();
      } else if (nextProductId) {
        router.replace(routes.admin.adminProductDetail(nextProductId));
      } else {
        router.replace(routes.admin.adminProducts);
      }
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      toast.apiError(error, mode === "edit" ? t("editProduct") : t("addProduct"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProductAction() {
    try {
      await runAdminProductAction(productId, actionDialog.action);
      toast.success(t("products"), t("productActionCompleted"));
      setActionDialog({ open: false, action: "" });
      await reloadProduct();
    } catch (error) {
      toast.apiError(error, t("products"));
    }
  }

  if (state.loading) {
    return <PageLoadingState title={t("loadingProductEditor")} />;
  }

  if (state.error) {
    if (state.error.status === 404) {
      return (
        <EmptyState
          title={t("productNotFound")}
          description={t("adminProductNotFoundDescription")}
          actionLabel={t("backToProducts")}
          actionHref={routes.admin.adminProducts}
        />
      );
    }

    return (
      <ErrorState
        title={t("failedToLoad")}
        description={t("adminProductLoadError")}
        actionLabel={t("retry")}
        onAction={() => window.location.reload()}
      />
    );
  }

  const pageTitle = mode === "edit" ? t("editProduct") : t("addProduct");
  const filteredModels = (brandId) =>
    state.catalogs.vehicleModels.filter(
      (item) => !brandId || !item.parentId || item.parentId === brandId,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={mode === "edit" ? t("adminEditProductDescription") : t("adminAddProductDescription")}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={routes.admin.adminProducts}>
              <Button variant="outline">{t("backToProducts")}</Button>
            </Link>
            {mode === "edit" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    setActionDialog({
                      open: true,
                      action:
                        formValues.visibilityStatus === "published" ? "unpublish" : "publish",
                    })
                  }
                >
                  {formValues.visibilityStatus === "published" ? t("unpublishProduct") : t("publish")}
                </Button>
                <Button variant="outline" onClick={() => setActionDialog({ open: true, action: "archive" })}>
                  {t("archive")}
                </Button>
                <Button variant="outline" onClick={() => setActionDialog({ open: true, action: "mark-sold" })}>
                  {t("markAsSold")}
                </Button>
              </>
            ) : null}
            <Button variant="outline" disabled={submitting} onClick={() => handleSubmit("draft")}>
              {t("saveDraft")}
            </Button>
            <Button disabled={submitting} onClick={() => handleSubmit(mode === "edit" ? "" : "published")}>
              {mode === "edit" ? t("saveProduct") : t("publish")}
            </Button>
          </div>
        }
      />

      {Object.keys(fieldErrors).length > 0 ? (
        <Alert variant="error" title={t("validationError")}>
          {t("reviewRequiredFields")}
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard number={1} title={t("basicInformation")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("productName")} required error={getFieldError("name")}>
                <Input value={formValues.name} onChange={(event) => setValue("name", event.target.value)} />
              </Field>
              <Field label={t("slug")} error={getFieldError("slug")}>
                <Input value={formValues.slug} onChange={(event) => setValue("slug", event.target.value)} />
              </Field>
              <Field label={t("sku")} required error={getFieldError("sku")}>
                <Input value={formValues.sku} onChange={(event) => setValue("sku", event.target.value)} />
              </Field>
              <Field label={t("oemNumber")} error={getFieldError("oemNumber")}>
                <Input value={formValues.oemNumber} onChange={(event) => setValue("oemNumber", event.target.value)} />
              </Field>
              <Field label={t("partNumber")} error={getFieldError("partNumber")}>
                <Input value={formValues.partNumber} onChange={(event) => setValue("partNumber", event.target.value)} />
              </Field>
              <Field label={t("category")} required error={getFieldError("categoryId")}>
                <Select value={formValues.categoryId} onChange={(event) => setValue("categoryId", event.target.value)}>
                  <option value="">{t("selectCategory")}</option>
                  {state.catalogs.categories.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("subcategory")} error={getFieldError("subcategoryId")}>
                <Input
                  value={formValues.subcategoryId}
                  onChange={(event) => setValue("subcategoryId", event.target.value)}
                  placeholder={t("optionalSubcategoryHint")}
                />
              </Field>
              <Field label={t("brand")} error={getFieldError("partsBrandId")}>
                <Select value={formValues.partsBrandId} onChange={(event) => setValue("partsBrandId", event.target.value)}>
                  <option value="">{t("selectBrand")}</option>
                  {state.catalogs.partsBrands.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t("shortDescription")} error={getFieldError("shortDescription")}>
              <Textarea
                className="min-h-28"
                value={formValues.shortDescription}
                onChange={(event) => setValue("shortDescription", event.target.value)}
              />
            </Field>
          </SectionCard>

          {mode === "edit" ? (
            <ProductMediaManager
              productId={productId}
              media={state.product?.media ?? []}
              onMediaChange={reloadProduct}
              t={t}
              toast={toast}
            />
          ) : (
            <SectionCard number={2} title={t("uploadImages")}>
              <Alert variant="info" title={t("uploadImages")}>
                {t("saveProductBeforeImages")}
              </Alert>
            </SectionCard>
          )}

          <SectionCard number={3} title={t("pricingAndInventory")}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={t("price")} required error={getFieldError("priceMinor")}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.priceSar}
                  onChange={(event) => setValue("priceSar", event.target.value)}
                />
              </Field>
              <Field label={t("comparePrice")} error={getFieldError("compareAtPriceMinor")}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.comparePriceSar}
                  onChange={(event) => setValue("comparePriceSar", event.target.value)}
                />
              </Field>
              <Field label={t("stockQuantity")} required error={getFieldError("stockQuantity")}>
                <Input
                  type="number"
                  min="0"
                  value={formValues.stockQuantity}
                  onChange={(event) => setValue("stockQuantity", event.target.value)}
                />
              </Field>
              <Field label={t("lowStockThreshold")} error={getFieldError("lowStockThreshold")}>
                <Input
                  type="number"
                  min="0"
                  value={formValues.lowStockThreshold}
                  onChange={(event) => setValue("lowStockThreshold", event.target.value)}
                />
              </Field>
              <Field label={t("inventoryStatus")} error={getFieldError("inventoryStatus")}>
                <Select
                  value={formValues.inventoryStatus}
                  onChange={(event) => setValue("inventoryStatus", event.target.value)}
                >
                  <option value="in_stock">{t("inStock")}</option>
                  <option value="low_stock">{t("lowStock")}</option>
                  <option value="out_of_stock">{t("outOfStock")}</option>
                  <option value="sold">{t("markAsSold")}</option>
                </Select>
              </Field>
              <Field label={t("visibility")} error={getFieldError("status")}>
                <Select
                  value={formValues.visibilityStatus}
                  onChange={(event) => setValue("visibilityStatus", event.target.value)}
                >
                  <option value="draft">{t("draft")}</option>
                  <option value="published">{t("publish")}</option>
                  <option value="archived">{t("archive")}</option>
                </Select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard number={4} title={t("conditionDetails")}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={t("condition")} error={getFieldError("condition")}>
                <Select value={formValues.condition} onChange={(event) => setValue("condition", event.target.value)}>
                  <option value="used">{t("usedCondition")}</option>
                  <option value="refurbished">{t("refurbished")}</option>
                  <option value="reconditioned">{t("reconditioned")}</option>
                </Select>
              </Field>
              <Field label={t("conditionScore")} error={getFieldError("conditionScore")}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formValues.conditionScore}
                  onChange={(event) => setValue("conditionScore", event.target.value)}
                />
              </Field>
              <Field label={t("testedStatus")} error={getFieldError("testedStatus")}>
                <Select value={formValues.testedStatus} onChange={(event) => setValue("testedStatus", event.target.value)}>
                  <option value="">{t("selectStatus")}</option>
                  <option value="tested">{t("tested")}</option>
                  <option value="untested">{t("untested")}</option>
                  <option value="fully_tested">{t("fullyTested")}</option>
                </Select>
              </Field>
              <Field label={t("knownDefects")} error={getFieldError("knownDefects")}>
                <Input
                  value={formValues.knownDefects}
                  onChange={(event) => setValue("knownDefects", event.target.value)}
                />
              </Field>
              <Field label={t("warrantyDays")} error={getFieldError("warrantyDays")}>
                <Input
                  type="number"
                  min="0"
                  value={formValues.warrantyDays}
                  onChange={(event) => setValue("warrantyDays", event.target.value)}
                />
              </Field>
              <Field label={t("returnEligible")} error={getFieldError("returnEligible")}>
                <label className="flex h-12 items-center gap-3 rounded-2xl border border-border px-4 text-sm text-foreground">
                  <Checkbox
                    checked={formValues.returnEligible}
                    onChange={(event) => setValue("returnEligible", event.target.checked)}
                  />
                  {t("returnEligible")}
                </label>
              </Field>
            </div>
          </SectionCard>

          <SectionCard number={5} title={t("vehicleCompatibility")}>
            <div className="space-y-4">
              {formValues.compatibility.map((entry) => (
                <div key={entry.id} className="grid gap-4 rounded-[2rem] border border-border p-4 md:grid-cols-2 xl:grid-cols-6">
                  <Field label={t("vehicleBrand")} error={getFieldError("compatibility")}>
                    <Select
                      value={entry.vehicleBrandId}
                      onChange={(event) => updateCompatibilityRow(entry.id, "vehicleBrandId", event.target.value)}
                    >
                      <option value="">{t("selectBrand")}</option>
                      {state.catalogs.vehicleBrands.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("vehicleModel")} error={getFieldError("compatibility")}>
                    <Select
                      value={entry.vehicleModelId}
                      onChange={(event) => updateCompatibilityRow(entry.id, "vehicleModelId", event.target.value)}
                    >
                      <option value="">{t("selectModel")}</option>
                      {filteredModels(entry.vehicleBrandId).map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("yearFrom")} error={getFieldError("compatibility")}>
                    <Input value={entry.yearFrom} onChange={(event) => updateCompatibilityRow(entry.id, "yearFrom", event.target.value)} />
                  </Field>
                  <Field label={t("yearTo")} error={getFieldError("compatibility")}>
                    <Input value={entry.yearTo} onChange={(event) => updateCompatibilityRow(entry.id, "yearTo", event.target.value)} />
                  </Field>
                  <Field label={t("engine")} error={getFieldError("compatibility")}>
                    <Input value={entry.engine} onChange={(event) => updateCompatibilityRow(entry.id, "engine", event.target.value)} />
                  </Field>
                  <Field label={t("engineCode")} error={getFieldError("compatibility")}>
                    <Input value={entry.engineCode} onChange={(event) => updateCompatibilityRow(entry.id, "engineCode", event.target.value)} />
                  </Field>
                  <Field label={t("partPosition")} error={getFieldError("compatibility")}>
                    <Input value={entry.position} onChange={(event) => updateCompatibilityRow(entry.id, "position", event.target.value)} />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeCompatibilityRow(entry.id)}
                      disabled={formValues.compatibility.length === 1}
                    >
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCompatibilityRow}>
                {t("addAnotherVehicle")}
              </Button>
            </div>
          </SectionCard>

          <SectionCard number={6} title={t("description")}>
            <Field label={t("description")} error={getFieldError("description")}>
              <Textarea value={formValues.description} onChange={(event) => setValue("description", event.target.value)} />
            </Field>
            <Field label={t("specifications")} error={getFieldError("specifications")}>
              <Textarea
                className="min-h-28"
                value={formValues.specifications}
                onChange={(event) => setValue("specifications", event.target.value)}
              />
            </Field>
          </SectionCard>

          <SectionCard number={7} title={t("visibility")}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
                <Checkbox checked={formValues.featured} onChange={(event) => setValue("featured", event.target.checked)} />
                <span>{t("featuredProduct")}</span>
              </label>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <ProductPreview formValues={formValues} product={state.product} t={t} />
          {mode === "edit" && state.product?.changeHistory?.length > 0 ? (
            <Card className="space-y-4 rounded-[2rem]">
              <h2 className="text-lg font-semibold text-foreground">{t("changeHistory")}</h2>
              <div className="space-y-4">
                {state.product.changeHistory.map((entry) => (
                  <div key={entry.id} className="rounded-[1.5rem] border border-border p-4">
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.description || "--"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{entry.timestamp || "--"}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Link href={routes.admin.adminProducts}>
          <Button variant="outline">{t("cancel")}</Button>
        </Link>
        <Button variant="outline" disabled={submitting} onClick={() => handleSubmit("draft")}>
          {t("saveDraft")}
        </Button>
        <Button disabled={submitting} onClick={() => handleSubmit("")}>
          {mode === "edit" ? t("saveProduct") : t("publish")}
        </Button>
      </div>

      <ConfirmationDialog
        open={actionDialog.open}
        title={getActionDialogCopy(actionDialog.action).title}
        description={getActionDialogCopy(actionDialog.action).description}
        confirmLabel={getActionDialogCopy(actionDialog.action).confirmLabel}
        tone="warning"
        onCancel={() => setActionDialog({ open: false, action: "" })}
        onConfirm={handleProductAction}
        itemPreview={
          state.product ? (
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
                {state.product.media?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.product.media[0].url} alt={state.product.name} className="size-full object-cover" />
                ) : (
                  <BoxIcon className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{state.product.name}</p>
                <p className="text-sm text-muted-foreground">{state.product.sku}</p>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

export function AdminProductNewPage() {
  return <AdminProductEditorPage mode="new" />;
}

export function AdminProductEditPage({ productId }) {
  return <AdminProductEditorPage mode="edit" productId={productId} />;
}
