import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function SearchPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Search"
        description="The public search page shell is ready. It will connect to the backend product search endpoint in a later step."
      />
      <Card>
        <CardHeader>
          <CardTitle>Search experience placeholder</CardTitle>
          <CardDescription>
            Search results, suggestions, and OEM lookup will be built on top of the shared API client next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            No fake business data has been added here. This route exists to verify the public layout, spacing, and future navigation flow.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
