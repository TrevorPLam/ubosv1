import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Users, Search, Mail, Phone, FileText, DollarSign, Calendar } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Search & Filters",
    description: "Find anyone instantly by name, role, department, location, or employment type. Filter by start date, compensation range, or document status.",
  },
  {
    icon: Phone,
    title: "Contact Details",
    description: "Personal and work phone, email, Slack handle, emergency contacts, and office location stored in a structured, always-current profile.",
  },
  {
    icon: DollarSign,
    title: "Compensation Records",
    description: "Salary, hourly rate, equity grants, bonus targets, and pay schedule — all version-tracked so you have a full history of changes.",
  },
  {
    icon: FileText,
    title: "Document Vault",
    description: "Offer letters, signed NDAs, contracts, tax forms, and performance reviews attached directly to each person's record.",
  },
  {
    icon: Calendar,
    title: "Employment Timeline",
    description: "Start date, role changes, promotions, department transfers, and leave periods visualized on a single timeline per person.",
  },
  {
    icon: Mail,
    title: "Contractor Management",
    description: "Separate contractor profiles with rate cards, engagement dates, SOW attachments, and payment terms tracked alongside full-time staff.",
  },
];

const employees = [
  { name: "Sarah Chen", role: "Head of Product", dept: "Product", type: "FTE", start: "Jan 2022", status: "active" },
  { name: "Marcus Rivera", role: "Senior Engineer", dept: "Engineering", type: "FTE", start: "Mar 2023", status: "active" },
  { name: "Priya Nair", role: "Growth Marketer", dept: "Marketing", type: "FTE", start: "Jul 2023", status: "active" },
  { name: "Tom Okafor", role: "UX Designer", dept: "Design", type: "Contractor", start: "Nov 2024", status: "active" },
  { name: "Elena Volkov", role: "Finance Analyst", dept: "Finance", type: "FTE", start: "Feb 2021", status: "on-leave" },
];

export function DirectoryPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/team" className="hover:text-foreground transition-colors">Team</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Directory</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <p className="text-muted-foreground mt-1">A central, searchable record for every employee and contractor.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Headcount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">Employees & contractors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Full-Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground mt-1">Salaried employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
            <p className="text-xs text-muted-foreground mt-1">Active engagements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Currently out</p>
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
              <CardTitle className="text-sm">Recent Profiles</CardTitle>
              <CardDescription>Latest activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {employees.map((emp) => (
                <div key={emp.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.role} · {emp.dept}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    emp.status === "active"
                      ? "text-green-500 border-green-500/30 bg-green-500/10 shrink-0"
                      : "text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0"
                  }>
                    {emp.status === "on-leave" ? "On Leave" : "Active"}
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
