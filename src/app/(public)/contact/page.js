import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ContactPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Contact Us"
        description="Public contact and enquiry forms will connect to backend enquiry endpoints in a later step."
      />
      <Card>
        <CardHeader>
          <CardTitle>Support placeholder</CardTitle>
          <CardDescription>
            AD Auto Parts support flows will live here without exposing any backend internals.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          Saudi support placeholders are shown in the shared footer and navbar for now.
        </CardContent>
      </Card>
    </Container>
  );
}
