import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/constants/routes";

export default function AdminIndexPage() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Admin area placeholder</CardTitle>
        <CardDescription>
          The admin shell is ready with sidebar and topbar structure. Full admin screens will be implemented in later steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link href={routes.admin.adminDashboard}>
          <Button>Open Dashboard</Button>
        </Link>
        <Link href={routes.public.home}>
          <Button variant="outline">Back to Store</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
