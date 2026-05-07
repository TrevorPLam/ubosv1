import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ListChecks, Search, Tag, FileText, GitBranch, RefreshCw, Users } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Consistent SOP Template",
    description: "Every procedure follows the same structure — purpose, scope, roles responsible, step-by-step instructions, and a revision log — so nothing is left to interpretation.",
  },
  {
    icon: Search,
    title: "Search by Role or Process",
    description: "Find any SOP instantly by filtering on the responsible role, department, process category, or free-text keyword across all steps.",
  },
  {
    icon: Tag,
    title: "Tagging & Categories",
    description: "Organize procedures by team, frequency, risk level, and compliance requirement. Tag cross-functional SOPs so they surface for every team involved.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Each SOP can be scoped to the roles that need it. New employees see the procedures relevant to them on day one without being overwhelmed.",
  },
  {
    icon: GitBranch,
    title: "Version History",
    description: "Every edit is tracked with a timestamp and the author's name. Compare any two versions side-by-side and roll back to any previous state.",
  },
  {
    icon: RefreshCw,
    title: "Review Schedules",
    description: "Assign a review cadence to each SOP — quarterly, annually, or on trigger — so owners are reminded before procedures go stale.",
  },
];

const sops = [
  { title: "Client Onboarding", role: "Account Manager", category: "Sales", status: "current", updated: "Mar 2026" },
  { title: "Payroll Processing", role: "Finance", category: "HR", status: "current", updated: "Jan 2026" },
  { title: "Support Escalation", role: "Support Lead", category: "Support", status: "needs-review", updated: "Oct 2025" },
  { title: "New Hire Setup", role: "IT / HR", category: "HR", status: "current", updated: "Feb 2026" },
  { title: "Invoice Approval", role: "Finance", category: "Finance", status: "draft", updated: "Apr 2026" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "current") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 shrink-0">Current</Badge>;
  if (status === "needs-review") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0">Needs Review</Badge>;
  return <Badge variant="outline" className="text-muted-foreground shrink-0">Draft</Badge>;
}

export function SOPsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/knowledge" className="hover:text-foreground transition-colors">Knowledge</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">SOPs</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SOPs</h1>
        <p className="text-muted-foreground mt-1">Step-by-step standard operating procedures searchable by role or process.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Procedures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">28</div>
            <p className="text-xs text-muted-foreground mt-1">Up to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">4</div>
            <p className="text-xs text-muted-foreground mt-1">Overdue for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
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
              <CardTitle className="text-sm">Recent SOPs</CardTitle>
              <CardDescription>Latest procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sops.map((sop) => (
                <div key={sop.title} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{sop.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{sop.role} · {sop.updated}</p>
                  </div>
                  <StatusBadge status={sop.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
