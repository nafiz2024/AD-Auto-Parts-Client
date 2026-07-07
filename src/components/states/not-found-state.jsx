import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowLeftIcon, BagIcon, HomeIcon, SettingsIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";

export function NotFoundState() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-border bg-white px-6 py-12 text-center shadow-soft sm:px-10">
        <div className="relative mx-auto max-w-3xl">
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
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">Page Not Found</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={routes.public.home}>
            <Button variant="outline" size="lg">
              <HomeIcon className="size-5" />
              Back to Home
            </Button>
          </Link>
          <Link href={routes.public.products}>
            <Button size="lg">
              <ArrowLeftIcon className="size-5 rotate-180" />
              Shop Parts
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
