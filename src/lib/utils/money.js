import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/config/env";

function normalizeMinorAmount(amountMinor) {
  const numericAmount = Number(amountMinor);

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  return numericAmount;
}

export function formatMoneyMinor(
  amountMinor,
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
) {
  const normalizedAmount = normalizeMinorAmount(amountMinor) / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizedAmount);
}

export function formatSarMinor(amountMinor, locale = DEFAULT_LOCALE) {
  return formatMoneyMinor(amountMinor, locale, "SAR");
}
