import { Suspense } from "react";
import { CustomerAuthPage } from "@/features/auth/customer-auth-page";

export default function CustomerRegisterRoute() {
  return (
    <Suspense fallback={null}>
      <CustomerAuthPage mode="register" />
    </Suspense>
  );
}
