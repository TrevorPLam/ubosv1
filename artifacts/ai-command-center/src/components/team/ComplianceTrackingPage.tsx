import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ShieldCheck, Award, Bell, BarChart2, FileSearch, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Certification Registry",
    description: "Track every required license and certification per role — issue date, expiry, issuing body, and certificate file — linked to the employee record.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Configurable alerts sent to the employee, their manager, and HR at 90, 60, and 30 days before any certification or license expires.",
  },
  {
    icon: FileSearch,
    title: "Mandatory Training Log",
    description: "Record completion of required training — safety, security, harassment prevention, role-specific — with date, score, and provider stored per person.",
  },
  {
    icon: BarChart2,
    title: "Compliance Dashboard",
    description: "Organization-wide view of compliance posture by department, role, and individual — showing compliant, at-risk, and overdue counts at a glance.",
  },
  {
    icon: RefreshCw,
    title: "Renewal Workflows",
    description: "When a certification is expiring, trigger a structured renewal workflow: assign the training, track re-certification, and update the record on completion.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-Ready Reports",
    description: "Export a point-in-time compliance report for any date range, role, or individual — formatted for regulatory submissions or internal audits.",
  },
];

const items = [
  { name: "Sarah Chen", cert: "Data Privacy (GDPR)", expires: "Aug 14, 2026", daysLeft: 99, status: "compliant" },
  { name: "Marcus Rivera", cert: "Security Awareness", expires: "Jun 1, 2026", daysLeft: 25, status: "at-risk" },
  { name: "Priya Nair", cert: "Anti-Harassment Training", expires: "May 15, 2026", daysLeft: 8, status: "at-risk" },
  { name: "Tom Okafor", cert: "Contractor Safety", expires: "Apr 30, 2026", daysLeft: -7, status: "overdue" },
  { name: "Elena Volkov", cert: "Financial Controls Cert", expires: "Dec 1, 2026", daysLeft: 208, status: "compliant" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "compliant") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>;
  if (status === "at-risk") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0"><Clock className="w-3 h-3 mr-1" />At Risk</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 shrink-0"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
}

export function ComplianceTrackingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Compliance Tracking</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Tracking</h1>
        <p className="text-muted-foreground mt-1">Track certifications, license expirations, and training completions with automated reminders.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">41</div>
            <p className="text-xs text-muted-foreground mt-1">Items up to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">7</div>
            <p className="text-xs text-muted-foreground mt-1">Expiring within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground mt-1">Organization compliance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Features</h2>
          {features.map((feature) => (
            <Card key={feature.title} className="cursor-pointer hover:bg-accent/30 transition-colors">
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Certification Status</CardTitle>
              <CardDescription>Upcoming expirations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.name + item.cert} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.cert} · {item.expires}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
