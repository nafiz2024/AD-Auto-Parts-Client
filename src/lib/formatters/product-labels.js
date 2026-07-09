function normalizeLabelToken(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const CONDITION_KEYS = {
  used_excellent: "conditionUsedExcellent",
  used_good: "conditionUsedGood",
  used_fair: "conditionUsedFair",
  reconditioned: "conditionReconditioned",
  refurbished: "conditionRefurbished",
  new: "conditionNew",
  unknown: "conditionUnknown",
};

const STOCK_KEYS = {
  in_stock: "stockInStock",
  limited_stock: "stockLimitedStock",
  low_stock: "stockLimitedStock",
  out_of_stock: "stockOutOfStock",
  unavailable: "stockOutOfStock",
  sold: "stockOutOfStock",
  sold_out: "stockOutOfStock",
};

export function getConditionTranslationKey(condition) {
  const token = normalizeLabelToken(condition);

  if (!token) {
    return "conditionUnknown";
  }

  return CONDITION_KEYS[token] ?? "conditionUnknown";
}

export function getStockTranslationKey(stock) {
  const token = normalizeLabelToken(stock);

  if (!token) {
    return "stockOutOfStock";
  }

  return STOCK_KEYS[token] ?? "stockOutOfStock";
}

export function getConditionLabel(t, condition, fallback = null) {
  return t(getConditionTranslationKey(condition), undefined, fallback ?? condition ?? t("conditionUnknown"));
}

export function getStockLabel(t, stock, fallback = null) {
  return t(getStockTranslationKey(stock), undefined, fallback ?? stock ?? t("stockOutOfStock"));
}
