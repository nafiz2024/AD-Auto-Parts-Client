import { cache } from "react";
import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizeProduct } from "@/features/listing/listing-api";

const RELATED_PRODUCTS_LIMIT = 4;
const REVIEW_PREVIEW_LIMIT = 3;
const DEFAULT_WHATSAPP_NUMBER = "966543216789";

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function normalizeItems(data) {
  return asArray(data?.items ?? data?.data ?? data);
}

function toTrimmedString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function normalizeMinorAmount(...values) {
  const amount = firstNumber(...values);
  return amount === null ? 0 : Math.round(amount);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

function sanitizeDisplayUrl(value) {
  const normalized = toTrimmedString(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/")
  ) {
    return normalized;
  }

  return null;
}

function uniqueBy(items, getter) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getter(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function resolveImageCandidates(item) {
  const rawImages = [
    ...asArray(item?.media),
    ...asArray(item?.images),
    ...asArray(item?.gallery),
    ...asArray(item?.productImages),
    ...asArray(item?.imageUrls),
  ];

  const leadingImage = firstString(
    item?.primaryImageUrl,
    item?.featuredImageUrl,
    item?.imageUrl,
    item?.thumbnailUrl,
    item?.mainImage,
    item?.image,
  );

  if (leadingImage) {
    rawImages.unshift({
      id: "primary-image",
      url: leadingImage,
      alt: item?.name ?? item?.title ?? "Product image",
      isPrimary: true,
    });
  }

  return uniqueBy(
    rawImages
      .map((image, index) => {
        if (typeof image === "string") {
          return {
            id: `image-${index}`,
            url: sanitizeDisplayUrl(image),
            alt: item?.name ?? item?.title ?? "Product image",
            isPrimary: index === 0,
          };
        }

        const url = sanitizeDisplayUrl(
          image?.url ??
            image?.imageUrl ??
            image?.src ??
            image?.path ??
            image?.thumbnailUrl,
        );

        if (!url) {
          return null;
        }

        return {
          id: image?.id ?? image?._id ?? image?.publicId ?? `image-${index}`,
          url,
          alt:
            firstString(image?.alt, image?.altText, image?.title, item?.name) ??
            "Product image",
          isPrimary:
            image?.isPrimary === true ||
            image?.isFeatured === true ||
            index === 0,
        };
      })
      .filter(Boolean),
    (image) => image.url,
  );
}

function normalizeStock(item) {
  const rawCode = firstString(
    item?.stockStatus,
    item?.availability,
    item?.status,
    item?.inventoryStatus,
  );
  const stockCode = rawCode ? rawCode.toLowerCase().replace(/\s+/g, "_") : null;
  const availableQuantity = firstNumber(
    item?.availableQuantity,
    item?.stockQuantity,
    item?.inventoryCount,
    item?.quantity,
    item?.qty,
  );
  const isSold =
    stockCode === "sold" ||
    stockCode === "sold_out" ||
    stockCode === "out_of_stock" ||
    stockCode === "unavailable" ||
    normalizeBoolean(item?.sold) ||
    normalizeBoolean(item?.isSold);
  const isLimited =
    stockCode === "limited_stock" ||
    stockCode === "low_stock" ||
    (availableQuantity !== null && availableQuantity > 0 && availableQuantity <= 3);
  const isInStock =
    !isSold &&
    (stockCode === "in_stock" ||
      normalizeBoolean(item?.inStock) ||
      normalizeBoolean(item?.available) ||
      (availableQuantity !== null && availableQuantity > 0));

  return {
    stockCode: stockCode ?? (isInStock ? "in_stock" : "out_of_stock"),
    stockLabel:
      firstString(
        item?.stockStatusLabel,
        item?.availabilityLabel,
        item?.inventoryStatusLabel,
      ) ??
      (isSold ? "Sold" : isLimited ? "Limited Stock" : isInStock ? "In Stock" : "Out of Stock"),
    availableQuantity,
    isLimitedStock: isLimited && !isSold,
    isSold,
    isInStock,
    isPurchasable: !isSold && isInStock,
  };
}

function buildYearRange(entry) {
  const yearFrom = firstNumber(
    entry?.yearFrom,
    entry?.startYear,
    entry?.fromYear,
    entry?.vehicleYearFrom,
  );
  const yearTo = firstNumber(
    entry?.yearTo,
    entry?.endYear,
    entry?.toYear,
    entry?.vehicleYearTo,
  );

  if (yearFrom && yearTo && yearFrom !== yearTo) {
    return `${yearFrom}-${yearTo}`;
  }

  if (yearFrom) {
    return String(yearFrom);
  }

  return null;
}

function normalizeCompatibility(item) {
  const rawEntries = [
    ...asArray(item?.compatibility),
    ...asArray(item?.compatibilities),
    ...asArray(item?.vehicleCompatibility),
    ...asArray(item?.vehicleCompatibilities),
    ...asArray(item?.fitments),
    ...asArray(item?.vehicles),
  ];

  const normalizedEntries = uniqueBy(
    rawEntries
      .map((entry, index) => {
        const vehicleBrand =
          firstString(
            entry?.vehicleBrand?.name,
            entry?.vehicleBrandName,
            entry?.brand?.name,
            entry?.brand,
          ) ?? null;
        const model =
          firstString(entry?.vehicleModel?.name, entry?.vehicleModelName, entry?.model) ??
          null;
        const engine = firstString(entry?.engine, entry?.engineName, entry?.engineType);
        const engineCode = firstString(entry?.engineCode, entry?.code);
        const position = firstString(entry?.position, item?.position);
        const yearRange = buildYearRange(entry);

        if (!vehicleBrand && !model && !yearRange && !engine && !engineCode && !position) {
          return null;
        }

        return {
          id: entry?.id ?? entry?._id ?? `compatibility-${index}`,
          vehicleBrand,
          model,
          yearRange,
          engine,
          engineCode,
          position,
        };
      })
      .filter(Boolean),
    (entry) =>
      [
        entry.vehicleBrand,
        entry.model,
        entry.yearRange,
        entry.engine,
        entry.engineCode,
        entry.position,
      ]
        .filter(Boolean)
        .join("|"),
  );

  const primaryEntry = normalizedEntries[0] ?? null;

  return {
    vehicleBrand:
      firstString(
        item?.vehicleBrand?.name,
        item?.vehicleBrandName,
        item?.vehicle?.brand,
        primaryEntry?.vehicleBrand,
      ) ?? null,
    model:
      firstString(
        item?.vehicleModel?.name,
        item?.vehicleModelName,
        item?.vehicle?.model,
        primaryEntry?.model,
      ) ?? null,
    yearRange:
      firstString(
        item?.yearRange,
        item?.compatibilitySummary,
        primaryEntry?.yearRange,
      ) ??
      buildYearRange(item),
    engine: firstString(item?.engine, item?.engineName, primaryEntry?.engine),
    engineCode: firstString(item?.engineCode, primaryEntry?.engineCode),
    position: firstString(item?.position, primaryEntry?.position),
    entries: normalizedEntries,
  };
}

function normalizeConditionSummary(item) {
  const rawDefects = item?.knownDefects ?? item?.defects ?? item?.issues ?? null;

  return {
    label:
      firstString(item?.conditionLabel, item?.conditionDisplay, item?.condition) ?? "Used",
    code: firstString(item?.condition, item?.conditionCode),
    score: firstNumber(item?.conditionScore, item?.score, item?.grade),
    testedStatus:
      firstString(item?.testedStatus, item?.testingStatus, item?.inspectionStatus) ??
      (normalizeBoolean(item?.tested) ? "Tested and verified" : null),
    knownDefects:
      Array.isArray(rawDefects)
        ? rawDefects.filter(Boolean).join(", ")
        : firstString(rawDefects, item?.defectNotes),
    usedMileage: firstString(item?.usedMileage, item?.mileage, item?.odometerReading),
    warrantyDays: firstNumber(item?.warrantyDays, item?.warranty?.days),
    returnEligible:
      typeof item?.returnEligible === "boolean"
        ? item.returnEligible
        : typeof item?.returnable === "boolean"
          ? item.returnable
          : null,
  };
}

function normalizeSpecifications(item) {
  const specificationRows = [
    ["OEM Number", firstString(item?.oemNumber, item?.oem)],
    ["Part Number", firstString(item?.partNumber)],
    [
      "Brand",
      firstString(
        item?.partsBrand?.name,
        item?.partsBrandName,
        item?.brand?.name,
        item?.brand,
      ),
    ],
    ["Manufacturer", firstString(item?.manufacturer, item?.maker)],
    ["Condition", firstString(item?.conditionLabel, item?.conditionDisplay, item?.condition)],
    ["Position", firstString(item?.position)],
    ["Country of Origin", firstString(item?.countryOfOrigin, item?.originCountry)],
    ["Material", firstString(item?.material)],
    ["SKU", firstString(item?.sku)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));

  const extraSpecifications = item?.additionalSpecifications ?? item?.specifications ?? {};

  if (extraSpecifications && typeof extraSpecifications === "object" && !Array.isArray(extraSpecifications)) {
    Object.entries(extraSpecifications).forEach(([label, value]) => {
      const normalizedValue =
        Array.isArray(value) ? value.filter(Boolean).join(", ") : firstString(value);

      if (label && normalizedValue) {
        specificationRows.push({ label, value: normalizedValue });
      }
    });
  }

  return uniqueBy(specificationRows, (entry) => entry.label.toLowerCase());
}

function normalizeReview(item) {
  return {
    id: item?.id ?? item?._id ?? item?.reviewNumber ?? `review-${Math.random().toString(36).slice(2)}`,
    reviewerName:
      firstString(
        item?.reviewerName,
        item?.customer?.displayName,
        item?.author?.name,
        item?.name,
      ) ?? "Verified customer",
    rating: firstNumber(item?.rating, item?.score),
    title: firstString(item?.title),
    comment:
      firstString(item?.comment, item?.review, item?.message, item?.content) ?? null,
    verifiedBuyer:
      typeof item?.verifiedBuyer === "boolean"
        ? item.verifiedBuyer
        : typeof item?.isVerifiedBuyer === "boolean"
          ? item.isVerifiedBuyer
          : false,
    createdAt: firstString(item?.createdAt, item?.submittedAt, item?.date),
  };
}

function normalizeDetailPayload(data) {
  return data?.item ?? data?.product ?? data?.data ?? data;
}

function normalizeProductDetail(item) {
  const listingBase = normalizeProduct(item);
  const stock = normalizeStock(item);
  const compatibility = normalizeCompatibility(item);
  const conditionSummary = normalizeConditionSummary(item);

  return {
    ...listingBase,
    ...stock,
    name: firstString(item?.name, item?.title, listingBase.name) ?? "Used Auto Part",
    slug: firstString(item?.slug, listingBase.slug, listingBase.id) ?? listingBase.id,
    categoryName:
      firstString(item?.category?.name, item?.categoryName, listingBase.categoryName) ??
      "Products",
    categorySlug:
      firstString(item?.category?.slug, item?.categorySlug, listingBase.categorySlug) ?? null,
    sku: firstString(item?.sku, item?.stockKeepingUnit),
    oemNumber: firstString(item?.oemNumber, item?.oem),
    partNumber: firstString(item?.partNumber),
    shortDescription:
      firstString(
        item?.shortDescription,
        item?.summary,
        item?.excerpt,
        listingBase.vehicleSummary,
      ) ?? null,
    description:
      firstString(item?.description, item?.fullDescription, item?.details) ??
      firstString(item?.shortDescription, item?.summary, item?.excerpt),
    priceMinor: normalizeMinorAmount(
      item?.priceMinor,
      item?.sellingPriceMinor,
      item?.currentPriceMinor,
      item?.price?.amount,
      listingBase.priceMinor,
    ),
    compareAtMinor:
      firstNumber(
        item?.compareAtPriceMinor,
        item?.originalPriceMinor,
        item?.priceBeforeDiscountMinor,
        listingBase.compareAtMinor,
      ) ?? null,
    discountLabel:
      firstString(
        item?.discountLabel,
        item?.discount?.label,
        item?.discountPercentage ? `${item.discountPercentage}%` : null,
      ) ?? null,
    images: resolveImageCandidates(item),
    compatibility,
    conditionSummary,
    specifications: normalizeSpecifications(item),
    deliveryNotes: uniqueBy(
      [
        firstString(item?.deliveryEstimate),
        firstString(item?.deliveryNote),
        ...asArray(item?.deliveryNotes).map(firstString),
      ]
        .filter(Boolean)
        .map((note, index) => ({ id: `delivery-${index}`, note })),
      (entry) => entry.note,
    ),
    returnNotes: uniqueBy(
      [
        firstString(item?.returnPolicy),
        firstString(item?.warrantyNote),
        ...asArray(item?.returnNotes).map(firstString),
      ]
        .filter(Boolean)
        .map((note, index) => ({ id: `return-${index}`, note })),
      (entry) => entry.note,
    ),
    ratingAverage:
      firstNumber(
        item?.ratingAverage,
        item?.averageRating,
        item?.reviewsSummary?.averageRating,
      ) ?? null,
    reviewCount:
      firstNumber(
        item?.reviewCount,
        item?.reviewsCount,
        item?.reviewsSummary?.totalReviews,
      ) ?? 0,
    whatsappNumber:
      firstString(item?.supportWhatsapp, item?.whatsappNumber)?.replace(/\D/g, "") ??
      DEFAULT_WHATSAPP_NUMBER,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      item?.category?.name && item?.category?.slug
        ? {
            label: item.category.name,
            href: `/categories/${item.category.slug}`,
          }
        : null,
      { label: firstString(item?.name, item?.title, listingBase.name) ?? "Product Details" },
    ].filter(Boolean),
  };
}

async function getRelatedProducts(productId) {
  try {
    const response = await apiGet(endpoints.public.relatedProducts(productId), {
      query: { limit: RELATED_PRODUCTS_LIMIT },
    });

    return {
      items: normalizeItems(response?.data)
        .map(normalizeProduct)
        .slice(0, RELATED_PRODUCTS_LIMIT),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error,
    };
  }
}

async function getReviewsPreview(product) {
  try {
    const response = await apiGet(endpoints.public.reviews, {
      query: {
        productId: product.id,
        limit: REVIEW_PREVIEW_LIMIT,
      },
    });
    const items = normalizeItems(response?.data)
      .map(normalizeReview)
      .filter((review) => review.comment || review.rating !== null);
    const reviewSummary = response?.data?.summary ?? response?.meta ?? null;

    return {
      items,
      averageRating:
        firstNumber(
          reviewSummary?.averageRating,
          reviewSummary?.ratingAverage,
          product.ratingAverage,
        ) ?? null,
      reviewCount:
        firstNumber(reviewSummary?.reviewCount, reviewSummary?.totalReviews, product.reviewCount) ??
        0,
      source: "api",
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      averageRating: product.ratingAverage,
      reviewCount: product.reviewCount,
      source: "unavailable",
      error,
    };
  }
}

export const getProductDetailPageData = cache(async (productId) => {
  try {
    const response = await apiGet(endpoints.public.productDetail(productId));
    const product = normalizeProductDetail(normalizeDetailPayload(response?.data));
    const [relatedProducts, reviews] = await Promise.all([
      getRelatedProducts(productId),
      getReviewsPreview(product),
    ]);

    return {
      product,
      relatedProducts,
      reviews,
      notFound: false,
    };
  } catch (error) {
    if (error?.status === 404) {
      return {
        product: null,
        relatedProducts: { items: [], error: null },
        reviews: {
          items: [],
          averageRating: null,
          reviewCount: 0,
          source: "unavailable",
          error: null,
        },
        notFound: true,
      };
    }

    throw error;
  }
});
