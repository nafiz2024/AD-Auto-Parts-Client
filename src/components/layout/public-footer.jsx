import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BrandLogo } from "@/components/layout/brand-logo";
import { routes } from "@/constants/routes";

const shopLinks = [
  { label: "Shop Parts", href: routes.public.products },
  { label: "Compatibility Search", href: routes.public.compatibility },
  { label: "Latest Arrivals", href: routes.public.products },
];

const supportLinks = [
  { label: "Contact Us", href: routes.public.contact },
  { label: "My Account", href: routes.customer.account },
  { label: "Order Support", href: routes.public.contact },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-[#f8f7f4]">
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
        <div className="space-y-4">
          <BrandLogo />
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            AD Auto Parts helps drivers and workshops across Saudi Arabia source trusted used auto parts with clean communication and reliable support.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            Shop
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {shopLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-brand-red">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            Customer Support
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {supportLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-brand-red">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            Contact
          </h3>
          <div className="text-sm leading-7 text-muted-foreground">
            <p>Riyadh, Saudi Arabia</p>
            <p>support@adautoparts.local</p>
            <p>+966 54 321 6789</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-border/80 bg-white">
        <Container className="grid gap-4 py-5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">✓</span>
            <span>Inspected parts</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">✓</span>
            <span>Nationwide delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">✓</span>
            <span>COD and manual advance payment</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">✓</span>
            <span>Customer support</span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
