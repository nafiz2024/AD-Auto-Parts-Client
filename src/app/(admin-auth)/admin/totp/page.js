import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

export default function AdminTotpPage() {
  redirect(routes.admin.adminTotp);
}
