"use client";

import { forwardRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef(function Input({ className, type, ...props }, ref) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const isPasswordField = type === "password";
  const resolvedType = isPasswordField && isPasswordVisible ? "text" : type;

  const input = (
    <input
      ref={ref}
      type={resolvedType}
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm leading-5 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
        isPasswordField && "pr-12",
        isInvalid && "border-error focus:border-error focus:ring-error/10",
        className,
      )}
      {...props}
    />
  );

  if (!isPasswordField) {
    return input;
  }

  return (
    <div className="relative w-full">
      {input}
      <button
        type="button"
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        aria-pressed={isPasswordVisible}
        onClick={() => setIsPasswordVisible((current) => !current)}
        disabled={props.disabled}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPasswordVisible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  );
});
