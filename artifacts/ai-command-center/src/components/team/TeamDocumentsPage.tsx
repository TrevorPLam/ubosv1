import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText, Upload, Search, Lock, History, Bell, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Document Upload & Linking",
    description: "Attach any file — offer letters, contracts, performance reviews, tax forms, signed policies — directly to an employee's record in seconds.",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description: "Search across all documents by employee name, document type, date signed, or keyword. Surface the right file without digging through folders.",
  },
  {
    icon: Lock,
    title: "Access Controls",
    description: "Granular permissions so HR sees everything, managers see their direct reports' docs, and employees see only their own — enforced at the file level.",
  },
  {
    icon: History,
    title: "Version History",
    description: "Every document version is retained with a timestamp and author. Revert to any prior version and see a full audit trail of who viewed or changed a file.",
  },
  {
    icon: Bell,
    title: "Expiration Alerts",
    description: "Set expiration dates on certifications, contracts, and signed policies. Get automated reminders before they lapse so nothing slips through the cracks.",
  },
  {
    icon: FileText,
    title: "E-Signature Integration",
    description: "Send documents for e-signature directly from the record. Signatures are timestamped and stored automatically once complete.",
  },
];

const recent = [
  { name: "Offer Letter — Jordan Lee", type: "Offer Letter", employee: "Jordan Lee", date: "May 5, 2026", status: "signed" },
  { name: "NDA — Tom Okafor", type: "NDA", employee: "Tom Okafor", date: "Nov 12, 2024", status: "signed" },
  { name: "Perf Review Q1 — Priya Nair", type: "Performance Review", employee: "Priya Nair", date: "Apr 2, 2026", status: "signed" },
  { name: "Employment Contract — Aisha Patel", type: "Contract", employee: "Aisha Patel", date: "May 6, 2026", status: "pending" },
  { name: "Benefits Enrollment — Marcus Rivera", type: "Policy", employee: "Marcus Rivera", date: "Mar 15, 2026", status: "signed" },
];

export function TeamDocumentsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Documents</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">Centralized repository for employee-related files stored against each person's record.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
            <p className="text-xs text-muted-foreground mt-1">Across all employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">4</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting e-sign</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Within 60 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Added This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17</div>
            <p className="text-xs text-muted-foreground mt-1">New uploads</p>
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
              <CardTitle className="text-sm">Recent Documents</CardTitle>
              <CardDescription>Latest uploads & status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recent.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.date}</p>
                  </div>
                  <Badge variant="outline" className={
                    doc.status === "signed"
                      ? "text-green-500 border-green-500/30 bg-green-500/10 shrink-0"
                      : "text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0"
                  }>
                    {doc.status === "signed" ? "Signed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
