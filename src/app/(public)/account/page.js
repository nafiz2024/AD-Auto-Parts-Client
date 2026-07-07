import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Account"
        description="Customer account UI will connect to real session, orders, payments, and invoice routes in later steps."
      />
      <Card>
        <CardHeader>
          <CardTitle>Account placeholder</CardTitle>
          <CardDescription>
            The public/customer shell is ready for authenticated account views when the next auth UI step begins.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          No protected route redirect logic has been forced here yet.
        </CardContent>
      </Card>
    </Container>
  );
}
