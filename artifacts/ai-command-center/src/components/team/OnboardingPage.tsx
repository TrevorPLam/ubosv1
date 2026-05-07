import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ClipboardList, FileSignature, BookOpen, Monitor, Key, Bell, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const features = [
  {
    icon: FileSignature,
    title: "Paperwork Automation",
    description: "Auto-generate offer letters, NDAs, tax forms, and policy acknowledgments pre-filled from the employee record. Route for e-signature before day one.",
  },
  {
    icon: BookOpen,
    title: "Training Assignment",
    description: "Assign role-specific training tracks from a library of courses. Track completion status and send reminders for outstanding modules.",
  },
  {
    icon: Monitor,
    title: "Equipment Provisioning",
    description: "Create equipment requests tied to the new hire record — laptop, peripherals, and access cards — with fulfillment status tracked in one view.",
  },
  {
    icon: Key,
    title: "System Access Setup",
    description: "Checklist for IT to provision accounts across every required tool — email, Slack, GitHub, CRM, finance — with confirmation logged per app.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Deadline-based reminders sent to HR, IT, the manager, and the new hire to keep every party on track in the weeks before the start date.",
  },
  {
    icon: ClipboardList,
    title: "Checklist Templates",
    description: "Role-specific onboarding checklists (engineer, sales, ops) that can be cloned and customized for each new hire in seconds.",
  },
];

const activeOnboarding = [
  { name: "Jordan Lee", role: "Software Engineer", startDate: "May 12, 2026", tasks: 14, done: 9, status: "in-progress" },
  { name: "Aisha Patel", role: "Account Executive", startDate: "May 19, 2026", tasks: 12, done: 4, status: "in-progress" },
  { name: "Connor Walsh", role: "Data Analyst", startDate: "Jun 02, 2026", tasks: 11, done: 0, status: "pending" },
];

export function OnboardingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Onboarding</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground mt-1">Prepare paperwork, assign training, and set up system access before day one.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Onboards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">In progress this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground mt-1">Of 37 total tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2d</div>
            <p className="text-xs text-muted-foreground mt-1">Before start date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
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
              <CardTitle className="text-sm">Active Onboards</CardTitle>
              <CardDescription>Current new hire progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeOnboarding.map((hire) => {
                const pct = hire.tasks > 0 ? Math.round((hire.done / hire.tasks) * 100) : 0;
                return (
                  <div key={hire.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{hire.name}</p>
                        <p className="text-[10px] text-muted-foreground">{hire.role} · Starts {hire.startDate}</p>
                      </div>
                      <Badge variant="outline" className={
                        hire.status === "in-progress"
                          ? "text-blue-500 border-blue-500/30 bg-blue-500/10 shrink-0"
                          : "text-muted-foreground border-border shrink-0"
                      }>
                        {hire.status === "in-progress" ? "In Progress" : "Pending"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{hire.done} / {hire.tasks} tasks · {pct}%</p>
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
