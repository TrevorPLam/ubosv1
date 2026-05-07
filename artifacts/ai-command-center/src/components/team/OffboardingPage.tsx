import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, LogOut, ShieldOff, Package, DollarSign, MessageSquare, ClipboardCheck, CheckCircle2, Clock } from "lucide-react";

const features = [
  {
    icon: ShieldOff,
    title: "Access Revocation",
    description: "Automatically generate an IT checklist to deactivate accounts across all systems — email, Slack, GitHub, CRM, finance — on or before the last day.",
  },
  {
    icon: Package,
    title: "Asset Collection",
    description: "Track every item of company hardware assigned to the departing employee and mark each as returned, with condition notes and serial numbers.",
  },
  {
    icon: DollarSign,
    title: "Final Payment Scheduling",
    description: "Calculate final paycheck including accrued PTO payout, expenses, and any clawback provisions. Schedule with payroll and flag to Finance.",
  },
  {
    icon: MessageSquare,
    title: "Exit Interview",
    description: "Send a structured exit survey and schedule a live exit interview. Store responses against the employee record for trend analysis.",
  },
  {
    icon: ClipboardCheck,
    title: "Departure Checklist",
    description: "Role-specific checklists covering knowledge transfer, client handoffs, internal documentation, and any contractual post-departure obligations.",
  },
  {
    icon: LogOut,
    title: "Offboarding Templates",
    description: "Pre-built templates for voluntary resignation, involuntary termination, and contract end — each with the correct sequence of tasks and notices.",
  },
];

const active = [
  { name: "David Kim", role: "Sales Manager", lastDay: "May 16, 2026", type: "Voluntary", tasks: 18, done: 11 },
  { name: "Rachel Torres", role: "QA Engineer", lastDay: "May 30, 2026", type: "Contract End", tasks: 14, done: 3 },
];

export function OffboardingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Offboarding</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Offboarding</h1>
        <p className="text-muted-foreground mt-1">Revoke access, collect assets, and complete exit tasks when someone leaves.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Offboards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">5</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Access Revoked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">Accounts this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">11</div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
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
              <CardTitle className="text-sm">Active Offboards</CardTitle>
              <CardDescription>Current departure progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {active.map((person) => {
                const pct = person.tasks > 0 ? Math.round((person.done / person.tasks) * 100) : 0;
                return (
                  <div key={person.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{person.name}</p>
                        <p className="text-[10px] text-muted-foreground">{person.role} · Last day {person.lastDay}</p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground border-border shrink-0 text-[10px]">
                        {person.type}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{person.done} / {person.tasks} tasks · {pct}%</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
