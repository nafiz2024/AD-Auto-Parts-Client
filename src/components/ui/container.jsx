import { cn } from "@/lib/utils/cn";

const widths = {
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Container({ className, size = "xl", ...props }) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[size], className)} {...props} />
  );
}
