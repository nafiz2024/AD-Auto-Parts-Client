"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BoxIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  getAdminCatalogOptions,
  getAdminProducts,
  runAdminProductAction,
} from "@/features/admin/product-admin-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_low_to_high", label: "Price Low to High" },
  { value: "price_high_to_low", label: "Price High to Low" },
  { value: "name_asc", label: "Name A-Z" },
];

function getStatusBadgeVariant(status) {
  if (status === "published") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  if (status === "sold") {
    return "info";
  }

  if (status === "archived") {
    return "neutral";
  }

  return "neutral";
}

function getStockBadgeVariant(stockStatus) {
  if (stockStatus === "in_stock") {
    return "success";
  }

  if (stockStatus === "low_stock") {
    return "warning";
  }

  if (stockStatus === "sold") {
    return "info";
  }

  return "error";
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function buildDialogContent(t, product, action) {
  if (!product || !action) {
    return null;
  }

  if (action === "publish") {
    return {
      title: t("publish"),
      description: t("publishProductConfirmation"),
      confirmLabel: t("publish"),
      tone: "warning",
    };
  }

  if (action === "unpublish") {
    return {
      title: t("unpublishProduct"),
      description: t("unpublishProductConfirmation"),
      confirmLabel: t("unpublishProduct"),
      tone: "warning",
    };
  }

  if (action === "archive") {
    return {
      title: t("archive"),
      description: t("archiveProductConfirmation"),
      confirmLabel: t("archive"),
      tone: "warning",
    };
  }

  return {
    title: t("markAsSold"),
    description: t("markAsSoldConfirmation"),
    confirmLabel: t("markAsSold"),
    tone: "warning",
  };
}

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

function buildFilters(searchParams) {
  return {
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    q: searchParams.get("q") || "",
    categoryId: searchParams.get("categoryId") || "",
    status: searchParams.get("status") || "",
    condition: searchParams.get("condition") || "",
    stock: searchParams.get("stock") || "",
    sort: searchParams.get("sort") || "newest",
  };
}

function ProductTable({ products, t, onAction }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3">{t("product")}</th>
            <th className="pb-3">{t("sku")}</th>
            <th className="pb-3">{t("category")}</th>
            <th className="pb-3">{t("condition")}</th>
            <th className="pb-3">{t("stockQuantity")}</th>
            <th className="pb-3">{t("price")}</th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("createdDate")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border/80 align-top last:border-b-0">
              <td className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                    {product.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.primaryImage} alt={product.name} className="size-full object-cover" />
                    ) : (
                      <BoxIcon className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.vehicleSummary || "--"}</p>
                    {product.partNumber ? (
                      <p className="text-xs text-muted-foreground">{t("partNumber")}: {product.partNumber}</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="py-4 text-muted-foreground">{product.sku}</td>
              <td className="py-4 text-muted-foreground">{product.categoryName}</td>
              <td className="py-4">
                <Badge variant="info">{product.conditionLabel}</Badge>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{product.stockQuantity ?? "--"}</p>
                  <Badge variant={getStockBadgeVariant(product.stockStatus)}>{product.stockLabel}</Badge>
                </div>
              </td>
              <td className="py-4">
                <PriceDisplay amountMinor={product.priceMinor} />
              </td>
              <td className="py-4">
                <Badge variant={getStatusBadgeVariant(product.publicationStatus)}>
                  {product.publicationStatus}
                </Badge>
              </td>
              <td className="py-4 text-muted-foreground">{formatDate(product.createdAt)}</td>
              <td className="py-4">
                <div className="flex flex-wrap gap-2">
                  <Link href={routes.admin.adminProductDetail(product.id)}>
                    <Button size="sm" variant="outline">{t("editProduct")}</Button>
                  </Link>
                  {product.publicationStatus === "published" ? (
                    <Button size="sm" variant="outline" onClick={() => onAction("unpublish", product)}>
                      {t("unpublishProduct")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onAction("publish", product)}>
                      {t("publish")}
                    </Button>
                  )}
                  {product.publicationStatus !== "archived" ? (
                    <Button size="sm" variant="outline" onClick={() => onAction("archive", product)}>
                      {t("archive")}
                    </Button>
                  ) : null}
                  {product.publicationStatus !== "sold" ? (
                    <Button size="sm" variant="outline" onClick={() => onAction("mark-sold", product)}>
                      {t("markAsSold")}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductCards({ products, t, onAction }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {products.map((product) => (
        <Card key={product.id} className="space-y-4 rounded-[2rem]">
          <div className="flex items-start gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {product.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.primaryImage} alt={product.name} className="size-full object-cover" />
              ) : (
                <BoxIcon className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.vehicleSummary || "--"}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{product.conditionLabel}</Badge>
                <Badge variant={getStockBadgeVariant(product.stockStatus)}>{product.stockLabel}</Badge>
                <Badge variant={getStatusBadgeVariant(product.publicationStatus)}>{product.publicationStatus}</Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("sku")}</p>
              <p className="mt-1 text-sm text-foreground">{product.sku}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("category")}</p>
              <p className="mt-1 text-sm text-foreground">{product.categoryName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("stockQuantity")}</p>
              <p className="mt-1 text-sm text-foreground">{product.stockQuantity ?? "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("price")}</p>
              <div className="mt-1">
                <PriceDisplay amountMinor={product.priceMinor} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={routes.admin.adminProductDetail(product.id)}>
              <Button size="sm" variant="outline">{t("editProduct")}</Button>
            </Link>
            {product.publicationStatus === "published" ? (
              <Button size="sm" variant="outline" onClick={() => onAction("unpublish", product)}>
                {t("unpublishProduct")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onAction("publish", product)}>
                {t("publish")}
              </Button>
            )}
            {product.publicationStatus !== "archived" ? (
              <Button size="sm" variant="outline" onClick={() => onAction("archive", product)}>
                {t("archive")}
              </Button>
            ) : null}
            {product.publicationStatus !== "sold" ? (
              <Button size="sm" variant="outline" onClick={() => onAction("mark-sold", product)}>
                {t("markAsSold")}
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminProductsPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState({
    loading: true,
    error: null,
    products: [],
    pagination: null,
    categories: [],
  });
  const [dialogState, setDialogState] = useState({ open: false, action: "", product: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const filters = buildFilters(searchParams);

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
        const currentFilters = {
          page: filters.page,
          q: filters.q,
          categoryId: filters.categoryId,
          status: filters.status,
          condition: filters.condition,
          stock: filters.stock,
          sort: filters.sort,
        };
        const [productsResult, catalogResult] = await Promise.all([
          getAdminProducts(currentFilters),
          getAdminCatalogOptions().catch(() => ({
            categories: [],
            vehicleBrands: [],
            vehicleModels: [],
            partsBrands: [],
          })),
        ]);

        if (active) {
          setState({
            loading: false,
            error: null,
            products: productsResult.items,
            pagination: productsResult.pagination,
            categories: catalogResult.categories,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            products: [],
            pagination: null,
            categories: [],
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, filters.categoryId, filters.condition, filters.page, filters.q, filters.sort, filters.status, filters.stock, refreshKey, router]);

  function replaceFilters(updates) {
    const query = updateSearchParams(searchParams.toString(), updates);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function handleActionClick(action, product) {
    setDialogState({
      open: true,
      action,
      product,
    });
  }

  async function handleConfirmAction() {
    const { action, product } = dialogState;

    if (!product || !action) {
      return;
    }

    try {
      await runAdminProductAction(product.id, action);
      toast.success(t("products"), t("productActionCompleted"));
      setDialogState({ open: false, action: "", product: null });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.apiError(error, t("products"));
    }
  }

  const dialogContent = buildDialogContent(t, dialogState.product, dialogState.action);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products")}
        description={t("adminProductsDescription")}
        action={
          <Link href={routes.admin.adminProductNew}>
            <Button>{t("addProduct")}</Button>
          </Link>
        }
      />

      <Card className="space-y-5 rounded-[2rem]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            value={filters.q}
            onChange={(event) => replaceFilters({ q: event.target.value, page: 1 })}
            placeholder={t("searchProducts")}
            className="xl:col-span-2"
          />
          <Select
            value={filters.categoryId}
            onChange={(event) => replaceFilters({ categoryId: event.target.value, page: 1 })}
          >
            <option value="">{t("allCategories")}</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(event) => replaceFilters({ status: event.target.value, page: 1 })}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="draft">{t("draft")}</option>
            <option value="published">{t("publish")}</option>
            <option value="archived">{t("archive")}</option>
            <option value="sold">{t("markAsSold")}</option>
          </Select>
          <Select
            value={filters.condition}
            onChange={(event) => replaceFilters({ condition: event.target.value, page: 1 })}
          >
            <option value="">{t("allConditions")}</option>
            <option value="used">{t("usedCondition")}</option>
            <option value="refurbished">{t("refurbished")}</option>
            <option value="reconditioned">{t("reconditioned")}</option>
          </Select>
          <Select
            value={filters.stock}
            onChange={(event) => replaceFilters({ stock: event.target.value, page: 1 })}
          >
            <option value="">{t("allStock")}</option>
            <option value="in_stock">{t("inStock")}</option>
            <option value="low_stock">{t("lowStock")}</option>
            <option value="out_of_stock">{t("outOfStock")}</option>
            <option value="sold">{t("markAsSold")}</option>
          </Select>
          <Select
            value={filters.sort}
            onChange={(event) => replaceFilters({ sort: event.target.value, page: 1 })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label === "Newest" ? "newest" : option.label === "Oldest" ? "oldest" : option.label === "Price Low to High" ? "priceLowToHigh" : option.label === "Price High to Low" ? "priceHighToLow" : "nameAscending")}
              </option>
            ))}
          </Select>
        </div>

        {state.loading ? (
          <TableRowSkeleton rows={6} />
        ) : state.error ? (
          <ErrorState
            title={t("failedToLoad")}
            description={t("adminProductsLoadError")}
            actionLabel={t("retry")}
            onAction={() => setRefreshKey((value) => value + 1)}
          />
        ) : state.products.length === 0 ? (
          <EmptyState
            icon={BoxIcon}
            title={t("products")}
            description={t("adminProductsEmptyDescription")}
            actionLabel={t("addProduct")}
            actionHref={routes.admin.adminProductNew}
          />
        ) : (
          <>
            <ProductTable products={state.products} t={t} onAction={handleActionClick} />
            <ProductCards products={state.products} t={t} onAction={handleActionClick} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {t("showing")} {state.products.length} {t("ofTotalProducts")}{" "}
                {state.pagination?.total ?? state.products.length}
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

      <ConfirmationDialog
        open={dialogState.open}
        title={dialogContent?.title}
        description={dialogContent?.description}
        confirmLabel={dialogContent?.confirmLabel}
        tone={dialogContent?.tone}
        onCancel={() => setDialogState({ open: false, action: "", product: null })}
        onConfirm={handleConfirmAction}
        itemPreview={
          dialogState.product ? (
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
                {dialogState.product.primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dialogState.product.primaryImage} alt={dialogState.product.name} className="size-full object-cover" />
                ) : (
                  <BoxIcon className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{dialogState.product.name}</p>
                <p className="text-sm text-muted-foreground">{dialogState.product.sku}</p>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
