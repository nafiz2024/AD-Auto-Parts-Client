"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ArrowLeftIcon, BoxIcon, SearchIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

export function ProductNotFoundState() {
  const { t } = useLanguage();

  return (
    <Container className="py-12 sm:py-16">
      <Card className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] p-0">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef5ff_58%,#dce8f7_100%)] p-10">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-border/60 bg-white shadow-soft">
              <BoxIcon className="size-24 text-slate-300" />
              <div className="absolute inset-block-end-8 inset-inline-end-7 rounded-full bg-brand-red/10 p-4 text-brand-red">
                <SearchIcon className="size-8" />
              </div>
            </div>
          </div>
          <div className="flex items-center p-8 sm:p-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {t("productNotFound")}
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Sorry, the product you are looking for doesn&apos;t exist or may have been removed.
                </p>
              </div>
              <Link href={routes.public.products}>
                <Button size="lg">
                  <ArrowLeftIcon className="size-5" />
                  {t("backToShop")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </Container>
  );
}
