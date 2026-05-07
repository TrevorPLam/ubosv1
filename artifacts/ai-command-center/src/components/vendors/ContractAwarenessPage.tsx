import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileSearch, CalendarClock, Bell, FileText, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const features = [
  {
    icon: CalendarClock,
    title: "Key Date Tracking",
    description: "Log contract start, end, and renewal notice deadlines per vendor. All dates visible in one place so nothing slips through.",
  },
  {
    icon: Bell,
    title: "Renewal Alerts",
    description: "Automated flags surface approaching notice deadlines before auto-renewals trigger — configurable lead times (30, 60, 90 days).",
  },
  {
    icon: FileText,
    title: "Document Linking",
    description: "Contract documents attached directly to the vendor record. One click from the date alert to the actual signed agreement.",
  },
  {
    icon: ShieldAlert,
    title: "Auto-Renewal Prevention",
    description: "Contracts flagged for review before the notice window closes. Approval required to let a renewal proceed or initiate cancellation.",
  },
  {
    icon: RefreshCw,
    title: "Renewal History",
    description: "Full audit trail of every renewal decision — approved, cancelled, renegotiated — with timestamps and the team member responsible.",
  },
];

const contracts = [
  {
    vendor: "CloudHost Pro",
    type: "SaaS Subscription",
    start: "Jan 1, 2025",
    end: "Dec 31, 2026",
    noticeDeadline: "Oct 1, 2026",
    status: "ok",
    daysUntilNotice: 147,
  },
  {
    vendor: "Acme Supplies Co.",
    type: "Supply Agreement",
    start: "Mar 15, 2024",
    end: "Mar 14, 2026",
    noticeDeadline: "Jan 14, 2026",
    status: "expired",
    daysUntilNotice: -113,
  },
  {
    vendor: "FastFreight LLC",
    type: "Logistics Contract",
    start: "Jun 1, 2025",
    end: "May 31, 2026",
    noticeDeadline: "Apr 30, 2026",
    status: "urgent",
    daysUntilNotice: 7,
  },
  {
    vendor: "Green Clean Services",
    type: "Service Agreement",
    start: "Sep 1, 2024",
    end: "Aug 31, 2026",
    noticeDeadline: "Jun 30, 2026",
    status: "warning",
    daysUntilNotice: 54,
  },
  {
    vendor: "Pinnacle Legal LLP",
    type: "Retainer",
    start: "Jan 1, 2026",
    end: "Dec 31, 2026",
    noticeDeadline: "Nov 30, 2026",
    status: "ok",
    daysUntilNotice: 207,
  },
];

function ContractStatusBadge({ status, days }: { status: string; days: number }) {
  if (status === "ok") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1" />{days}d away</Badge>;
  if (status === "warning") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 whitespace-nowrap"><Clock className="w-3 h-3 mr-1" />{days}d away</Badge>;
  if (status === "urgent") return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1" />{days}d left</Badge>;
  return <Badge variant="outline" className="text-muted-foreground border-muted whitespace-nowrap">Past deadline</Badge>;
}

export function ContractAwarenessPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Contract Awareness</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Contract Awareness</h1>
        <p className="text-muted-foreground mt-1">Key dates tracked per contract with automated alerts before renewals hit.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">Across all vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renewing in 90d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Need review soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">1</div>
            <p className="text-xs text-muted-foreground mt-1">Notice deadline &lt;14 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Contract Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8.4k</div>
            <p className="text-xs text-muted-foreground mt-1">Annual average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contract Calendar</h2>
            {contracts.map((c) => (
              <Card key={c.vendor} className={c.status === "urgent" ? "border-red-500/40" : c.status === "warning" ? "border-amber-500/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{c.vendor}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{c.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>Start: {c.start}</span>
                        <span>End: {c.end}</span>
                        <span className={c.status === "urgent" ? "text-red-500 font-medium" : c.status === "warning" ? "text-amber-500 font-medium" : ""}>
                          Notice by: {c.noticeDeadline}
                        </span>
                      </div>
                    </div>
                    <ContractStatusBadge status={c.status} days={c.daysUntilNotice} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
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
