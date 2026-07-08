"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcwIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

export function CheckoutErrorState() {
  const { t } = useLanguage();

  return (
    <Card className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
      <div className="rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(233,30,54,0.12),transparent_70%)]" />
      <div>
        <CardHeader className="px-0">
          <CardTitle className="text-4xl">{t("checkoutFailed")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-base text-muted-foreground">
            {t("checkoutFailedDescription")}
          </p>
          <Alert variant="error" title={t("paymentWasDeclined")} className="mt-5">
            {t("paymentNotSuccessful")}
          </Alert>
          <p className="mt-5 text-base text-muted-foreground">
            {t("ifProblemPersistsContactSupport")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>
              <RefreshCcwIcon className="size-4" />
              {t("tryAgain")}
            </Button>
            <Link href={routes.public.contact}>
              <Button variant="outline">{t("contactSupport")}</Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
