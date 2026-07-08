import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
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

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["active", "true", "1", "enabled"].includes(normalized)) {
        return true;
      }

      if (["inactive", "false", "0", "disabled"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function normalizeItems(value) {
  return asArray(value?.items ?? value?.data ?? value);
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value.map(cleanObject).filter((entry) => entry !== undefined);
  }

  if (!value || typeof value !== "object") {
    if (value === "") {
      return undefined;
    }

    return value;
  }

  const entries = Object.entries(value).reduce((accumulator, [key, innerValue]) => {
    const cleaned = cleanObject(innerValue);

    if (
      cleaned === undefined ||
      cleaned === null ||
      (Array.isArray(cleaned) && cleaned.length === 0)
    ) {
      return accumulator;
    }

    accumulator[key] = cleaned;
    return accumulator;
  }, {});

  return Object.keys(entries).length > 0 ? entries : undefined;
}

function normalizeVehicleModel(item) {
  const active = firstBoolean(item?.isActive, item?.active, item?.status) ?? true;

  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "model",
    vehicleBrandId:
      item?.vehicleBrandId ?? item?.brandId ?? item?.vehicleBrand?.id ?? item?.brand?._id ?? "",
    vehicleBrandName:
      firstString(item?.vehicleBrandName, item?.vehicleBrand?.name, item?.brand?.name) || "",
    name: firstString(item?.name, item?.title) || "Model",
    slug: firstString(item?.slug),
    yearFrom: firstNumber(item?.yearFrom, item?.startYear),
    yearTo: firstNumber(item?.yearTo, item?.endYear),
    engineOptions: asArray(item?.engineOptions ?? item?.engines)
      .map((entry) => firstString(entry?.name, entry?.label, entry))
      .filter(Boolean),
    active,
    statusLabel: active ? "active" : "inactive",
  };
}

function buildVehicleModelPayload(values) {
  const activeValue = values.active;

  return cleanObject({
    vehicleBrandId: firstString(values.vehicleBrandId),
    brandId: firstString(values.vehicleBrandId),
    name: firstString(values.name),
    slug: firstString(values.slug),
    yearFrom:
      values.yearFrom === "" || values.yearFrom === null || values.yearFrom === undefined
        ? undefined
        : Number(values.yearFrom),
    yearTo:
      values.yearTo === "" || values.yearTo === null || values.yearTo === undefined
        ? undefined
        : Number(values.yearTo),
    isActive: typeof activeValue === "boolean" ? activeValue : undefined,
    active: typeof activeValue === "boolean" ? activeValue : undefined,
    status: typeof activeValue === "boolean" ? (activeValue ? "active" : "inactive") : undefined,
  });
}

function detailPath(modelId) {
  return `${endpoints.admin.vehicleModels}/${modelId}`;
}

export async function getAdminVehicleModels(vehicleBrandId = "") {
  const query = vehicleBrandId
    ? { vehicleBrandId, brandId: vehicleBrandId }
    : undefined;
  const response = await apiGet(endpoints.admin.vehicleModels, { query });
  return normalizeItems(response.data).map(normalizeVehicleModel);
}

export async function createAdminVehicleModel(values) {
  const response = await apiPost(
    endpoints.admin.vehicleModels,
    buildVehicleModelPayload(values),
  );
  return normalizeVehicleModel(response.data ?? response.raw ?? values);
}

export async function updateAdminVehicleModel(modelId, values) {
  const response = await apiPatch(detailPath(modelId), buildVehicleModelPayload(values));
  return normalizeVehicleModel(response.data ?? response.raw ?? values);
}

export async function deleteAdminVehicleModel(modelId) {
  return apiDelete(detailPath(modelId));
}
