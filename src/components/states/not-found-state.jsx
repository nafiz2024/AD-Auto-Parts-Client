"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  ArrowLeftIcon,
  BagIcon,
  HomeIcon,
  MessageCircleIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

export function NotFoundState() {
  const { t } = useLanguage();

  return (
    <Container className="py-12 sm:py-20">
      <div className="mx-auto max-w-5xl rounded-[2.75rem] border border-border bg-white px-6 py-10 text-center shadow-soft sm:px-10 sm:py-12">
        <div className="flex justify-start">
          <BrandLogo />
        </div>
        <div className="relative mx-auto mt-8 max-w-3xl">
          <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(9,17,33,0.06),transparent_68%)]" />
          <div className="mb-6 flex justify-center gap-6 text-border">
            <SettingsIcon className="size-16 opacity-50" />
            <BagIcon className="size-16 opacity-20" />
          </div>
          <p className="text-[7rem] font-semibold leading-none tracking-tight text-foreground sm:text-[10rem]">
            404
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-end justify-center gap-4 text-brand-red">
            <div className="h-28 w-28 rounded-full border-8 border-border bg-white shadow-soft" />
            <div className="h-32 w-32 rounded-full border-8 border-border bg-white shadow-soft" />
            <div className="h-24 w-40 rounded-[1.75rem] border-8 border-border bg-white shadow-soft" />
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">
            {t("pageNotFound")}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            {t("pageNotFoundDescription")}
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={routes.public.home}>
            <Button variant="outline" size="lg">
              <HomeIcon className="size-5" />
              {t("backToHome")}
            </Button>
          </Link>
          <Link href={routes.public.products}>
            <Button size="lg">
              <ArrowLeftIcon className="size-5 rotate-180" />
              {t("shopAutoParts")}
            </Button>
          </Link>
          <Link href={routes.public.contact}>
            <Button variant="outline" size="lg">
              <MessageCircleIcon className="size-5" />
              {t("contactSupport")}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
