import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BarChart2, TrendingUp, Filter, Download, CheckCircle2, Clock, ShoppingCart } from "lucide-react";

const features = [
  {
    icon: BarChart2,
    title: "Spend by Vendor",
    description: "See exactly how much has been approved, ordered, and paid to each vendor — updated in real time as transactions move through the system.",
  },
  {
    icon: Filter,
    title: "Period Filtering",
    description: "Slice spend by any time window — current month, quarter, fiscal year, or custom range — without waiting for accounting to close the books.",
  },
  {
    icon: TrendingUp,
    title: "Trend Tracking",
    description: "Month-over-month spend trends per vendor highlight growing or shrinking categories before they become budget surprises.",
  },
  {
    icon: Download,
    title: "Export Ready",
    description: "Export spend summaries as CSV or PDF for budget reviews, board reporting, or AP reconciliation without manual data pulls.",
  },
];

const vendorSpend = [
  { vendor: "Pinnacle Legal LLP", category: "Legal", approved: "$18,000", ordered: "$18,000", paid: "$13,500", outstanding: "$4,500" },
  { vendor: "Acme Supplies Co.", category: "Office Supplies", approved: "$14,200", ordered: "$12,400", paid: "$12,400", outstanding: "$0" },
  { vendor: "FastFreight LLC", category: "Logistics", approved: "$10,200", ordered: "$8,750", paid: "$7,300", outstanding: "$1,450" },
  { vendor: "CloudHost Pro", category: "Software", approved: "$3,200", ordered: "$3,200", paid: "$3,200", outstanding: "$0" },
  { vendor: "Green Clean Services", category: "Facilities", approved: "$1,980", ordered: "$1,640", paid: "$1,640", outstanding: "$0" },
];

const monthlyTotals = [
  { month: "Jan", amount: 9200 },
  { month: "Feb", amount: 11400 },
  { month: "Mar", amount: 8700 },
  { month: "Apr", amount: 14200 },
  { month: "May", amount: 6100 },
];

const maxAmount = Math.max(...monthlyTotals.map((m) => m.amount));

const categories = [
  { name: "Legal", amount: "$18,000", pct: 36 },
  { name: "Office Supplies", amount: "$14,200", pct: 28 },
  { name: "Logistics", amount: "$10,200", pct: 20 },
  { name: "Software", amount: "$3,200", pct: 6 },
  { name: "Facilities", amount: "$1,980", pct: 4 },
  { name: "Other", amount: "$2,620", pct: 6 },
];

export function SpendVisibilityPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Spend Visibility</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Spend Visibility</h1>
        <p className="text-muted-foreground mt-1">Real-time view of approved, ordered, and paid spend — by vendor and time period.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$47,580</div>
            <p className="text-xs text-muted-foreground mt-1">YTD across all vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$43,990</div>
            <p className="text-xs text-muted-foreground mt-1">POs issued to vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$38,040</div>
            <p className="text-xs text-muted-foreground mt-1">Payments completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">$5,950</div>
            <p className="text-xs text-muted-foreground mt-1">Invoiced, not yet paid</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Spend by Vendor — YTD</CardTitle>
              <CardDescription>Approved vs. ordered vs. paid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {vendorSpend.map((v) => (
                  <div key={v.vendor} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{v.vendor}</p>
                        <p className="text-[10px] text-muted-foreground">{v.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{v.paid} paid</p>
                        {v.outstanding !== "$0" && (
                          <p className="text-[10px] text-amber-500">{v.outstanding} outstanding</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1"><ShoppingCart className="w-2.5 h-2.5" /> Approved: {v.approved}</div>
                      <div className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Ordered: {v.ordered}</div>
                      <div className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Paid: {v.paid}</div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${Math.round((parseInt(v.paid.replace(/[$,]/g, "")) / parseInt(v.approved.replace(/[$,]/g, ""))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Spend Trend</CardTitle>
              <CardDescription>Total vendor payments by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-28">
                {monthlyTotals.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">${(m.amount / 1000).toFixed(1)}k</span>
                    <div
                      className="w-full bg-primary/70 rounded-t-sm"
                      style={{ height: `${Math.round((m.amount / maxAmount) * 80)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Spend by Category</CardTitle>
              <CardDescription>YTD breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.amount}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{c.pct}%</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Capabilities</h2>
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0 mt-0.5">
                    <feature.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium mb-0.5">{feature.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
