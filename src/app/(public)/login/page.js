import { Suspense } from "react";
import { CustomerAuthPage } from "@/features/auth/customer-auth-page";

export default function CustomerLoginRoute() {
  return (
    <Suspense fallback={null}>
      <CustomerAuthPage mode="login" />
    </Suspense>
  );
}
