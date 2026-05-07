import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CalendarOff, Send, CheckCircle2, Clock, XCircle, CalendarDays, BarChart2, Bell } from "lucide-react";

const features = [
  {
    icon: Send,
    title: "Leave Requests",
    description: "Employees submit time-off requests with date range, type, and optional notes. Managers receive instant notifications and can approve or decline with one click.",
  },
  {
    icon: CheckCircle2,
    title: "Approval Workflows",
    description: "Configurable multi-step approval chains by department or seniority. Automatic escalation if a manager doesn't respond within the set SLA.",
  },
  {
    icon: CalendarDays,
    title: "Shared Calendar",
    description: "Team-wide calendar view showing who is out on any given day. Filter by department to spot coverage gaps before they become problems.",
  },
  {
    icon: BarChart2,
    title: "Balance Tracking",
    description: "Real-time accrual balances for vacation, sick, and other leave types per employee — including carry-over rules and annual cap enforcement.",
  },
  {
    icon: Bell,
    title: "Automated Notifications",
    description: "Request receipts, approval confirmations, and reminder emails sent automatically to the employee, their manager, and HR at each stage.",
  },
  {
    icon: XCircle,
    title: "Blackout Dates",
    description: "Set company-wide or team-specific blackout periods (e.g. quarter-end, product launches) where leave requests are automatically flagged for review.",
  },
];

const pending = [
  { name: "Marcus Rivera", type: "Vacation", dates: "May 26 – May 30", days: 5, status: "pending" },
  { name: "Priya Nair", type: "Sick Leave", dates: "May 8", days: 1, status: "pending" },
  { name: "Tom Okafor", type: "Personal", dates: "Jun 3 – Jun 4", days: 2, status: "approved" },
  { name: "Sarah Chen", type: "Vacation", dates: "Jun 16 – Jun 27", days: 10, status: "approved" },
];

export function TimeOffPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Time Off</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Time Off</h1>
        <p className="text-muted-foreground mt-1">Request-and-approval system for leave, with a shared calendar view of who is out.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Team members absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Across all leave types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4d</div>
            <p className="text-xs text-muted-foreground mt-1">Remaining vacation</p>
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
              <CardTitle className="text-sm">Upcoming Leave</CardTitle>
              <CardDescription>Requests & approvals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.map((req) => (
                <div key={req.name + req.dates} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{req.name}</p>
                    <p className="text-[10px] text-muted-foreground">{req.type} · {req.dates}</p>
                  </div>
                  <Badge variant="outline" className={
                    req.status === "approved"
                      ? "text-green-500 border-green-500/30 bg-green-500/10 shrink-0"
                      : "text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0"
                  }>
                    {req.status === "approved" ? "Approved" : "Pending"}
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
