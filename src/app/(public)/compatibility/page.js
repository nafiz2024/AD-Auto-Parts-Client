import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function CompatibilityPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Compatibility"
        description="Vehicle compatibility search will be connected in a later frontend step after the shared layout and i18n layers."
      />
      <Card>
        <CardHeader>
          <CardTitle>Compatibility tools placeholder</CardTitle>
          <CardDescription>
            This route confirms the navbar, footer, spacing, and responsive shell are wired correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            Future work here will connect to the backend compatibility search endpoint and vehicle brand/model data.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
