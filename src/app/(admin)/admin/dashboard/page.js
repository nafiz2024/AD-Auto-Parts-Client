import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { DashboardCardSkeleton, TableRowSkeleton } from "@/components/states/loading-states";

const metrics = [
  { title: "Total Orders", value: "352", change: "+12.5%", tone: "success" },
  { title: "Total Products", value: "1,248", change: "+8.3%", tone: "info" },
  { title: "Total Customers", value: "864", change: "+15.7%", tone: "success" },
  { title: "Total Enquiries", value: "48", change: "-4.2%", tone: "warning" },
];

const recentOrders = [
  { number: "#AP-240530", status: "Delivered", amountMinor: 435000 },
  { number: "#AP-240529", status: "Processing", amountMinor: 215000 },
  { number: "#AP-240528", status: "Confirmed", amountMinor: 678000 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back. This is a layout validation screen for the upcoming backend-connected admin analytics and operational views."
      />
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold text-foreground">{metric.value}</p>
                <Badge variant={metric.tone === "warning" ? "warning" : metric.tone === "info" ? "info" : "success"}>
                  {metric.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">UI placeholder only for now</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(239,68,68,0.08),transparent)] p-6">
              <div className="h-64 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(239,68,68,0.12),rgba(255,255,255,0.5))]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.number} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
                <div>
                  <p className="font-semibold text-foreground">{order.number}</p>
                  <p className="text-sm text-muted-foreground">Placeholder order row</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={order.status === "Delivered" ? "success" : order.status === "Processing" ? "warning" : "info"}>
                    {order.status}
                  </Badge>
                  <PriceDisplay amountMinor={order.amountMinor} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCardSkeleton />
        <TableRowSkeleton rows={5} />
      </div>
    </div>
  );
}
