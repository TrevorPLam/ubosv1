/**
 * @file        artifacts/ai-command-center/src/pages/Dashboard.tsx
 * @module      Pages / Dashboard
 * @purpose     Main dashboard page with CRM, work, calendar, documents, and finance widgets
 *
 * @ai_instructions
 *   - Must display mock data for CRM, work, calendar, documents, and finance
 *   - Must use responsive grid layout for widgets
 *   - Must provide navigation links to detailed pages
 *   - DO NOT modify the widget structure without updating the dashboard design system
 *
 * @exports     Dashboard
 * @imports     wouter, lucide-react, @/components/ui, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import {
  Users, TrendingUp, DollarSign, FileText, CalendarDays,
  KanbanSquare, ArrowUpRight, CheckCircle2, Clock, Eye,
  Flame, AlertTriangle, Circle, Star, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const crmSummary = {
  totalContacts: 8,
  hotLeads: 3,
  pipelineValue: 487500,
  topContacts: [
    { name: "Ava Thompson", company: "VertexOps", score: 95, status: "hot" },
    { name: "Sarah Chen", company: "Acme Corp", score: 92, status: "hot" },
    { name: "Yuki Tanaka", company: "Synth.jp", score: 88, status: "hot" },
    { name: "Marcus Webb", company: "TechFlow", score: 78, status: "warm" },
  ],
};

const workSummary = {
  inProgress: 4,
  inReview: 2,
  backlog: 6,
  done: 5,
  recentTasks: [
    { title: "Redesign onboarding flow", priority: "high", status: "in-progress" },
    { title: "API rate limiting audit", priority: "critical", status: "in-review" },
    { title: "Q2 financial report", priority: "medium", status: "in-progress" },
    { title: "Security patch v2.4", priority: "critical", status: "in-review" },
  ],
};

const calendarSummary = {
  todayEvents: [
    { title: "Product Sync", time: "9:00 AM", type: "meeting" },
    { title: "Design Review", time: "11:30 AM", type: "meeting" },
    { title: "Investor Call", time: "2:00 PM", type: "call" },
  ],
  upcomingTasks: 7,
};

const documentsSummary = {
  total: 24,
  pendingSignature: 3,
  recentlyModified: [
    { name: "Q2 Board Deck.pdf", status: "approved", modified: "2h ago" },
    { name: "Enterprise MSA v3.docx", status: "requires_signature", modified: "5h ago" },
    { name: "Product Roadmap 2026.pdf", status: "pending", modified: "1d ago" },
    { name: "NDA - TechFlow.pdf", status: "requires_signature", modified: "2d ago" },
  ],
};

const financeSummary = {
  netWorth: 217800,
  monthlyIncome: 9200,
  monthlyExpenses: 5900,
  cashFlow: 3300,
  savingsRate: 36,
};

const statusColors: Record<string, string> = {
  hot: "text-red-400",
  warm: "text-amber-400",
  cold: "text-blue-400",
};

const priorityColors: Record<string, string> = {
  critical: "text-red-400",
  high: "text-amber-400",
  medium: "text-blue-400",
  low: "text-zinc-400",
};

const docStatusColors: Record<string, string> = {
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  requires_signature: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
};

const docStatusLabel: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  requires_signature: "Needs Signature",
  draft: "Draft",
  expired: "Expired",
};

const taskStatusIcon: Record<string, React.ReactNode> = {
  "in-progress": <Clock className="w-3 h-3 text-blue-400" />,
  "in-review": <Eye className="w-3 h-3 text-purple-400" />,
  "backlog": <Circle className="w-3 h-3 text-zinc-400" />,
  "done": <CheckCircle2 className="w-3 h-3 text-green-400" />,
};

export function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>

        {/* Finance KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Net Worth</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${financeSummary.netWorth.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Monthly Income</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                ${financeSummary.monthlyIncome.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Cash Flow</span>
              </div>
              <p className="text-lg font-bold text-blue-400">
                +${financeSummary.cashFlow.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Savings Rate</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                {financeSummary.savingsRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* CRM */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">CRM</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-foreground font-medium">{crmSummary.hotLeads}</span> hot leads</span>
                <span className="text-foreground font-medium">${(crmSummary.pipelineValue / 1000).toFixed(0)}k pipeline</span>
                <Link href="/crm">
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {crmSummary.topContacts.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{c.score}</span>
                    <Flame className={cn("w-3.5 h-3.5", statusColors[c.status])} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Work */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Work</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-blue-400 font-medium">{workSummary.inProgress}</span> in progress</span>
                <span><span className="text-purple-400 font-medium">{workSummary.inReview}</span> in review</span>
                <Link href="/work">
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {workSummary.recentTasks.map((t) => (
                <div key={t.title} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {taskStatusIcon[t.status]}
                    <p className="text-sm text-foreground truncate">{t.title}</p>
                  </div>
                  <span className={cn("text-xs font-medium shrink-0 ml-2", priorityColors[t.priority])}>
                    {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Calendar</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-foreground font-medium">{calendarSummary.upcomingTasks}</span> tasks due this week</span>
                <Link href="/calendar">
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {calendarSummary.todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No events today.</p>
              ) : (
                calendarSummary.todayEvents.map((e) => (
                  <div key={e.title} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-sm text-foreground">{e.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{e.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-purple-400 font-medium">{documentsSummary.pendingSignature}</span> need signature</span>
                <span><span className="text-foreground font-medium">{documentsSummary.total}</span> total</span>
                <Link href="/documents">
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {documentsSummary.recentlyModified.map((d) => (
                <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground truncate">{d.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{d.modified}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", docStatusColors[d.status])}>
                      {docStatusLabel[d.status]}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </ScrollArea>
  );
}
