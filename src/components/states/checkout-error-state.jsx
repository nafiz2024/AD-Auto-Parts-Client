import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcwIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";

export function CheckoutErrorState() {
  return (
    <Card className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
      <div className="rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(233,30,54,0.12),transparent_70%)]" />
      <div>
        <CardHeader className="px-0">
          <CardTitle className="text-4xl">Checkout Failed</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-base text-muted-foreground">
            We couldn&apos;t complete your order due to the following issue:
          </p>
          <Alert variant="error" title="Payment was declined" className="mt-5">
            Your payment was not successful. Please try a different payment method.
          </Alert>
          <p className="mt-5 text-base text-muted-foreground">
            If the problem persists, please contact our support team.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>
              <RefreshCcwIcon className="size-4" />
              Try Again
            </Button>
            <Link href={routes.public.contact}>
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
