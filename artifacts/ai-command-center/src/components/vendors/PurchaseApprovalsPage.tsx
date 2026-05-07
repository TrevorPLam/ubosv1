import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ClipboardCheck, Send, Bell, ShoppingCart, FileCheck2, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Purchase Request Form",
    description: "Simple form capturing what's needed, from which vendor, estimated amount, and business justification. Submitted in seconds.",
  },
  {
    icon: Bell,
    title: "Approver Notifications",
    description: "Designated approvers are notified instantly via the platform. Approve or decline from any device without logging into a separate system.",
  },
  {
    icon: Send,
    title: "Automatic PO Generation",
    description: "Approved requests automatically generate a formatted purchase order sent directly to the vendor's contact on file.",
  },
  {
    icon: FileCheck2,
    title: "Invoice Matching",
    description: "Incoming vendor bills are matched against open purchase orders — flagging discrepancies before payment is released.",
  },
  {
    icon: ShoppingCart,
    title: "Order Tracking",
    description: "Track every purchase request from submission through approval, PO issuance, delivery confirmation, and final payment.",
  },
];

const requests = [
  {
    id: "PR-0041",
    description: "Office chairs (×6)",
    vendor: "Acme Supplies Co.",
    amount: "$1,800",
    requestedBy: "M. Torres",
    date: "May 7, 2026",
    status: "pending",
  },
  {
    id: "PR-0040",
    description: "Annual SaaS renewal — CloudHost Pro",
    vendor: "CloudHost Pro",
    amount: "$3,200",
    requestedBy: "J. Kim",
    date: "May 5, 2026",
    status: "approved",
  },
  {
    id: "PR-0039",
    description: "Emergency freight — Q2 samples",
    vendor: "FastFreight LLC",
    amount: "$1,450",
    requestedBy: "R. Patel",
    date: "Apr 29, 2026",
    status: "approved",
  },
  {
    id: "PR-0038",
    description: "Cleaning supplies restock",
    vendor: "Green Clean Services",
    amount: "$340",
    requestedBy: "M. Torres",
    date: "Apr 25, 2026",
    status: "declined",
  },
  {
    id: "PR-0037",
    description: "Legal retainer Q2 invoice",
    vendor: "Pinnacle Legal LLP",
    amount: "$4,500",
    requestedBy: "A. Johnson",
    date: "Apr 18, 2026",
    status: "approved",
  },
];

function RequestStatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
  if (status === "pending") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 whitespace-nowrap"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 whitespace-nowrap"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
}

export function PurchaseApprovalsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Purchase Approvals</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Approvals</h1>
        <p className="text-muted-foreground mt-1">Request, approve, and track purchases from submission through payment — all in one flow.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground mt-1">$24,680 total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoice Mismatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">1</div>
            <p className="text-xs text-muted-foreground mt-1">Needs review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Requests</h2>
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>1 pending review</span>
              </div>
            </div>
            {requests.map((r) => (
              <Card key={r.id} className={r.status === "pending" ? "border-amber-500/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                        <span className="text-sm font-medium truncate">{r.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>Vendor: {r.vendor}</span>
                        <span>By: {r.requestedBy}</span>
                        <span>{r.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-semibold">{r.amount}</span>
                      <RequestStatusBadge status={r.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How It Works</h2>
          {features.map((feature, i) => (
            <Card key={feature.title}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted shrink-0 mt-0.5 text-[11px] font-bold text-muted-foreground">
                  {i + 1}
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
  );
}
