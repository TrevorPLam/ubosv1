import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, BarChart2, TrendingUp, Users, Mail, Zap,
  DollarSign, MousePointerClick, Eye, UserCheck, CheckCircle2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const campaignPerformance = [
  { name: "Onboarding Welcome", type: "Sequence", openRate: 68.0, clickRate: 47.0, conversions: 201, revenue: "$40,200" },
  { name: "Enterprise Nurture", type: "Automated", openRate: 45.1, clickRate: 33.4, conversions: 22, revenue: "$88,000" },
  { name: "Q2 Product Launch", type: "Standard", openRate: 35.9, clickRate: 23.8, conversions: 38, revenue: "$19,000" },
  { name: "Re-engagement Series", type: "Sequence", openRate: 31.1, clickRate: 25.1, conversions: 12, revenue: "$14,400" },
  { name: "Churn Prevention", type: "Standard", openRate: 32.9, clickRate: 17.6, conversions: 4, revenue: "$6,800" },
];

const dealReports = [
  { label: "Total Pipeline Value", value: "$700,500", change: "+12% vs last quarter", positive: true },
  { label: "Weighted Pipeline", value: "$312,000", change: "By win probability", positive: true },
  { label: "Avg Deal Size", value: "$70,050", change: "+8% vs last quarter", positive: true },
  { label: "Avg Sales Cycle", value: "18 days", change: "-3 days vs last quarter", positive: true },
  { label: "Win Rate", value: "34%", change: "+4pp vs last quarter", positive: true },
  { label: "Deals Lost", value: "8", change: "3 to competitor", positive: false },
];

const contactTrend = [
  { month: "Jan", contacts: 3340 },
  { month: "Feb", contacts: 3490 },
  { month: "Mar", contacts: 3600 },
  { month: "Apr", contacts: 3720 },
  { month: "May", contacts: 3847 },
];
const maxContacts = Math.max(...contactTrend.map((m) => m.contacts));

const automationReports = [
  { name: "Lead Scoring Engine", enrolled: 1842, completed: 1204, completionRate: 65, goal: "Score ≥ 70" },
  { name: "Hot Lead Alert", enrolled: 243, completed: 243, completionRate: 100, goal: "Notify sales rep" },
  { name: "Post-Demo Follow-up", enrolled: 128, completed: 98, completionRate: 77, goal: "Schedule next step" },
  { name: "Renewal Campaign", enrolled: 31, completed: 12, completionRate: 39, goal: "Renewal signed" },
];

const aiInsights = [
  "Contacts tagged 'Enterprise' convert at 3.2× the rate of untagged contacts.",
  "The Onboarding Welcome sequence drives 42% of first-month revenue.",
  "Deals that receive a proposal within 3 days of demo close 61% faster.",
  "Open rates peak on Tuesday mornings — current scheduling is 18% below optimal.",
];

export function CRMAnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Analytics</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Campaign, automation, deal, and contact reporting in one place.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: "3,847", sub: "+124 this month", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Revenue Attributed", value: "$168.4K", sub: "From campaigns", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Avg Open Rate", value: "42.4%", sub: "vs 21% industry", icon: Eye, color: "text-violet-400", bg: "bg-violet-400/10" },
          { label: "Pipeline Win Rate", value: "34%", sub: "+4pp this quarter", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground leading-tight">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{card.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Performance</CardTitle>
              <CardDescription>All campaigns ranked by open rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignPerformance.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{c.name}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.type}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-emerald-400">{c.revenue}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{c.openRate}% open</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-2.5 h-2.5" />{c.clickRate}% click</span>
                    <span className="flex items-center gap-1"><UserCheck className="w-2.5 h-2.5" />{c.conversions} conversions</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${c.openRate}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact Growth</CardTitle>
              <CardDescription>Monthly contact trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-24">
                {contactTrend.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{(m.contacts / 1000).toFixed(1)}k</span>
                    <div className="w-full bg-primary/70 rounded-t-sm" style={{ height: `${Math.round((m.contacts / maxContacts) * 60)}px` }} />
                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Automation Performance</CardTitle>
              <CardDescription>Completion rates across active automations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationReports.map((a) => (
                <div key={a.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{a.name}</p>
                    <span className={cn("text-xs font-semibold", a.completionRate >= 70 ? "text-emerald-400" : a.completionRate >= 40 ? "text-amber-400" : "text-muted-foreground")}>{a.completionRate}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.enrolled.toLocaleString()} enrolled · {a.completed.toLocaleString()} completed · Goal: {a.goal}</p>
                  <Progress value={a.completionRate} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deal Summary</CardTitle>
              <CardDescription>Pipeline & performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealReports.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">{r.label}</p>
                    <p className={cn("text-[10px]", r.positive ? "text-emerald-400" : "text-red-400")}>{r.change}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0">{r.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI Insights
              </CardTitle>
              <CardDescription>Active Intelligence findings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
