import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Award, Bell, LinkIcon, BarChart2, Upload, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Log Earned Certifications",
    description: "Record any certification with issuing body, issue date, expiry date, credential ID, and the certificate file — stored against the employee record.",
  },
  {
    icon: LinkIcon,
    title: "Employee Record Integration",
    description: "Certifications are linked directly to each person's profile in the Team directory, giving a single view of all credentials per individual.",
  },
  {
    icon: Bell,
    title: "Renewal Alerts",
    description: "Both the employee and their manager receive automated alerts at 90, 60, and 30 days before any certification expires — with a direct renewal link.",
  },
  {
    icon: BarChart2,
    title: "Org-Wide Dashboard",
    description: "Filter certifications by department, role, or credential type. See current, expiring, and expired counts at a glance across the whole organization.",
  },
  {
    icon: RefreshCw,
    title: "Renewal Workflow",
    description: "When a cert is nearing expiry, trigger a structured renewal task: assign the exam or course, track completion, and update the record automatically.",
  },
  {
    icon: Award,
    title: "Credential Verification",
    description: "Attach the certificate file or verification URL so auditors and managers can confirm authenticity without chasing paperwork.",
  },
];

const certs = [
  { name: "Sarah Chen", cert: "AWS Solutions Architect", expires: "Sep 2026", daysLeft: 122, status: "compliant" },
  { name: "Marcus Rivera", cert: "Certified Scrum Master", expires: "Jun 10, 2026", daysLeft: 34, status: "at-risk" },
  { name: "Priya Nair", cert: "Google Analytics 4", expires: "May 20, 2026", daysLeft: 13, status: "at-risk" },
  { name: "Tom Okafor", cert: "Figma Advanced Design", expires: "Apr 15, 2026", daysLeft: -22, status: "overdue" },
  { name: "Elena Volkov", cert: "CPA License", expires: "Jan 2027", daysLeft: 245, status: "compliant" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "compliant") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Valid</Badge>;
  if (status === "at-risk") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 shrink-0"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
}

export function CertificationsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/knowledge" className="hover:text-foreground transition-colors">Knowledge</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Certifications</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
        <p className="text-muted-foreground mt-1">Log earned certifications, link them to employee records, and get alerts before renewal deadlines hit.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Certs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">63</div>
            <p className="text-xs text-muted-foreground mt-1">Across all employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">54</div>
            <p className="text-xs text-muted-foreground mt-1">Active & up to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">6</div>
            <p className="text-xs text-muted-foreground mt-1">Within 60 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Requires renewal</p>
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
              <CardDescription>Upcoming renewals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {certs.map((cert) => (
                <div key={cert.name + cert.cert} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{cert.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{cert.cert} · {cert.expires}</p>
                  </div>
                  <StatusBadge status={cert.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
