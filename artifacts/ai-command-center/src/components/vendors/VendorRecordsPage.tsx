import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Building2, Phone, FileText, CreditCard, Receipt, ShoppingCart, MessageSquare, CheckCircle2, Clock } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Supplier Profile",
    description: "Company name, website, industry category, primary contact, billing address, and internal notes — all in one structured record per vendor.",
  },
  {
    icon: Phone,
    title: "Contact Directory",
    description: "Multiple contacts per vendor with roles (sales rep, AP contact, account manager), phone, email, and preferred communication channel.",
  },
  {
    icon: CreditCard,
    title: "Payment & Account Details",
    description: "Payment terms (Net 30, Net 60, etc.), accepted payment methods, account numbers, banking details, and tax ID stored securely per vendor.",
  },
  {
    icon: FileText,
    title: "Document Attachments",
    description: "Attach contracts, W-9s, insurance certificates, NDAs, and any other vendor documents directly to the record with version tracking.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase History",
    description: "Running log of every purchase order, invoice, and payment linked to the vendor — searchable and filterable by date, amount, and status.",
  },
  {
    icon: MessageSquare,
    title: "Interaction Log",
    description: "Chronological record of every conversation, email thread, call note, and dispute resolution tied to the vendor relationship.",
  },
];

const vendors = [
  { name: "Acme Supplies Co.", category: "Office Supplies", contact: "Jane Doe", terms: "Net 30", status: "active", spend: "$12,400" },
  { name: "CloudHost Pro", category: "Software / SaaS", contact: "Mark Liu", terms: "Monthly", status: "active", spend: "$3,200" },
  { name: "FastFreight LLC", category: "Logistics", contact: "Rosa Martinez", terms: "Net 15", status: "active", spend: "$8,750" },
  { name: "Green Clean Services", category: "Facilities", contact: "Tom Baker", terms: "Net 30", status: "review", spend: "$1,980" },
];

const recentActivity = [
  { vendor: "Acme Supplies Co.", event: "Invoice #4421 received", amount: "$2,100", date: "May 6, 2026", type: "invoice" },
  { vendor: "CloudHost Pro", event: "Payment sent", amount: "$3,200", date: "May 1, 2026", type: "payment" },
  { vendor: "FastFreight LLC", event: "PO #882 issued", amount: "$1,450", date: "Apr 29, 2026", type: "order" },
  { vendor: "Green Clean Services", event: "Contract renewal discussion", amount: "—", date: "Apr 25, 2026", type: "conversation" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
  return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    invoice: <Receipt className="w-3.5 h-3.5" />,
    payment: <CreditCard className="w-3.5 h-3.5" />,
    order: <ShoppingCart className="w-3.5 h-3.5" />,
    conversation: <MessageSquare className="w-3.5 h-3.5" />,
  };
  return <span className="text-muted-foreground">{icons[type]}</span>;
}

export function VendorRecordsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Vendor Records</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Records</h1>
        <p className="text-muted-foreground mt-1">A complete profile per supplier — contacts, terms, documents, and full interaction history.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground mt-1">Active supplier records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents Filed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground mt-1">Contracts, W-9s, certs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">412</div>
            <p className="text-xs text-muted-foreground mt-1">POs, invoices, payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Pending qualification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Record Capabilities</h2>
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0 mt-0.5">
                    <feature.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">{feature.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vendor Directory</CardTitle>
              <CardDescription>Active supplier accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendors.map((v) => (
                <div key={v.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">{v.name}</p>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{v.category} · {v.terms} · {v.spend} YTD</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <CardDescription>Latest interactions across all vendors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5"><ActivityIcon type={a.type} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.event}</p>
                    <p className="text-[10px] text-muted-foreground">{a.vendor} · {a.date}</p>
                  </div>
                  {a.amount !== "—" && (
                    <p className="text-xs font-medium shrink-0">{a.amount}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
