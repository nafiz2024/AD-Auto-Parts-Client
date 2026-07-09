"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  ArrowRightIcon,
  BoxIcon,
  MessageCircleIcon,
  SearchIcon,
  ShieldIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

function ValueCard({ icon: Icon, title, description }) {
  return (
    <Card className="rounded-[2rem] p-5">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-navy/[0.05] text-brand-navy">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    </Card>
  );
}

function CapabilityCard({ title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-white px-5 py-5 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

export function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_28%,#f8f7f4_100%)]">
      <section className="border-b border-border/70 bg-[linear-gradient(120deg,#091121_0%,#112240_46%,#1d2435_100%)] text-white">
        <Container className="space-y-5 py-8 lg:py-12">
          <Breadcrumbs
            items={[
              { label: t("home"), href: routes.public.home },
              { label: t("aboutAdAutoParts") },
            ]}
          />
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                {t("aboutAdAutoParts")}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t("aboutHeadline")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/78">
                {t("aboutIntro")}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={routes.public.shop}>
                  <Button size="lg">
                    {t("shopAutoParts")}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </Link>
                <Link href={routes.public.contact}>
                  <Button variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                    {t("contactUs")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CapabilityCard
                title={t("usedPartsPositioning")}
                description={t("usedPartsPositioningCopy")}
              />
              <CapabilityCard
                title={t("inspectionFocus")}
                description={t("inspectionFocusCopy")}
              />
              <CapabilityCard
                title={t("compatibilitySupport")}
                description={t("compatibilitySupportCopy")}
              />
              <CapabilityCard
                title={t("deliverySupport")}
                description={t("deliverySupportCopy")}
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-8 py-8 pb-16 xl:py-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <Card className="rounded-[2rem] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
              {t("whoWeAre")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {t("whyAdAutoPartsExists")}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              {t("aboutMissionCopy")}
            </p>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              {t("aboutTrustCopy")}
            </p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <ValueCard
              icon={ShieldIcon}
              title={t("inspectedParts")}
              description={t("aboutInspectedPartsCopy")}
            />
            <ValueCard
              icon={SearchIcon}
              title={t("compatibilitySupport")}
              description={t("aboutCompatibilityCopy")}
            />
            <ValueCard
              icon={TruckIcon}
              title={t("nationwideDelivery")}
              description={t("aboutDeliveryCopy")}
            />
            <ValueCard
              icon={UsersIcon}
              title={t("customerSupport")}
              description={t("aboutSupportCopy")}
            />
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("whatWeSell")}
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
              {t("whatWeSellCopy")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              t("engineAndMechanical"),
              t("electricalAndLighting"),
              t("suspensionAndBrake"),
              t("bodyAndTrim"),
            ].map((item) => (
              <Card key={item} className="rounded-[1.75rem] p-5 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                  <BoxIcon className="size-7" />
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">{item}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-border/70 bg-brand-navy px-6 py-8 text-white shadow-soft sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
                {t("whyChooseUs")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {t("ourBusinessValues")}
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-white/78">
                {t("ourBusinessValuesCopy")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={routes.public.shop}>
                <Button size="lg" className="bg-brand-red hover:bg-brand-red/90">
                  {t("shopAutoParts")}
                </Button>
              </Link>
              <Link href={routes.public.contact}>
                <Button variant="outline" size="lg" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <MessageCircleIcon className="size-5" />
                  {t("contactSupport")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
