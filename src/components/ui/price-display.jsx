import { formatSarMinor } from "@/lib/utils/money";

export function PriceDisplay({ amountMinor, locale, className = "" }) {
  return (
    <span className={`font-semibold text-foreground ${className}`}>
      {formatSarMinor(amountMinor, locale)}
    </span>
  );
}
