import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, Plus, Filter, MoreHorizontal,
  Send, Eye, MousePointerClick, UserCheck,
  Play, Pause, Calendar, Zap, Activity,
  BarChart3, Users, TrendingUp, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const campaigns = [
  { id: 1, name: "Q2 Product Launch", type: "Standard", status: "active", sent: 4820, opens: 1734, clicks: 412, conversions: 38, openRate: 35.9, clickRate: 23.8, sentDate: "May 2, 2026" },
  { id: 2, name: "Re-engagement Series", type: "Sequence", status: "active", sent: 1240, opens: 386, clicks: 97, conversions: 12, openRate: 31.1, clickRate: 25.1, sentDate: "Apr 28, 2026" },
  { id: 3, name: "Enterprise Nurture Flow", type: "Automated", status: "active", sent: 890, opens: 401, clicks: 134, conversions: 22, openRate: 45.1, clickRate: 33.4, sentDate: "Ongoing" },
  { id: 4, name: "Churn Prevention", type: "Standard", status: "paused", sent: 310, opens: 102, clicks: 18, conversions: 4, openRate: 32.9, clickRate: 17.6, sentDate: "Apr 15, 2026" },
  { id: 5, name: "Onboarding Welcome", type: "Sequence", status: "active", sent: 2150, opens: 1462, clicks: 687, conversions: 201, openRate: 68.0, clickRate: 47.0, sentDate: "Ongoing" },
];

const automations = [
  { id: 1, name: "Lead Scoring Engine", trigger: "Contact created", actions: 6, enrolled: 1842, completed: 1204, active: true, goal: "Score ≥ 70" },
  { id: 2, name: "Hot Lead Alert", trigger: "Score exceeds 85", actions: 3, enrolled: 243, completed: 243, active: true, goal: "Notify sales rep" },
  { id: 3, name: "Deal Stale Reminder", trigger: "No activity for 7 days", actions: 4, enrolled: 56, completed: 32, active: true, goal: "Re-engage deal" },
  { id: 4, name: "Post-Demo Follow-up", trigger: "Meeting completed", actions: 5, enrolled: 128, completed: 98, active: true, goal: "Schedule next step" },
  { id: 5, name: "Win/Loss Analysis", trigger: "Deal stage = Closed", actions: 3, enrolled: 74, completed: 74, active: false, goal: "Collect feedback" },
  { id: 6, name: "Renewal Campaign", trigger: "Contract ends in 60d", actions: 8, enrolled: 31, completed: 12, active: true, goal: "Renewal signed" },
];

export function EmailPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Email</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Email</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> Create
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Campaigns Active", value: "4", sub: "12.4K recipients", icon: Send, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Avg Open Rate", value: "42.4%", sub: "vs 21% industry", icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Avg Click Rate", value: "29.4%", sub: "vs 2.9% industry", icon: MousePointerClick, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Automations", value: "5", sub: "2,300 enrolled", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground leading-tight">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-4">
        <Tabs defaultValue="campaigns" className="flex flex-col h-full">
          <TabsList className="w-fit shrink-0 mb-4">
            <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" /> Automations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-foreground">{c.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.type}</Badge>
                          <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", c.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10")}>
                            {c.status === "active" ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{c.sentDate}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Report</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>{c.status === "active" ? "Pause" : "Resume"}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Send className="w-3 h-3" />Sent</span>
                        <span className="font-semibold text-foreground text-sm">{c.sent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Eye className="w-3 h-3" />Open Rate</span>
                        <span className="font-semibold text-sm" style={{ color: c.openRate > 40 ? "rgb(52,211,153)" : c.openRate > 25 ? "rgb(251,191,36)" : "rgb(148,163,184)" }}>{c.openRate}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MousePointerClick className="w-3 h-3" />Click Rate</span>
                        <span className="font-semibold text-sm" style={{ color: c.clickRate > 30 ? "rgb(52,211,153)" : c.clickRate > 20 ? "rgb(251,191,36)" : "rgb(148,163,184)" }}>{c.clickRate}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3" />Conversions</span>
                        <span className="font-semibold text-foreground text-sm">{c.conversions}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Opens", pct: Math.round((c.opens / c.sent) * 100) },
                        { label: "Clicks", pct: Math.round((c.clicks / c.opens) * 100) },
                        { label: "Conversions", pct: Math.round((c.conversions / c.sent) * 100) },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{m.label}</span><span>{m.pct}%</span>
                          </div>
                          <Progress value={m.pct} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="automations" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                {automations.map((a) => {
                  const completionRate = Math.round((a.completed / a.enrolled) * 100);
                  return (
                    <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", a.active ? "bg-emerald-400/10" : "bg-muted")}>
                            <Zap className={cn("w-4 h-4", a.active ? "text-emerald-400" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-foreground">{a.name}</span>
                              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1", a.active ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-muted")}>
                                {a.active ? <><Activity className="w-2.5 h-2.5" />Active</> : <><Pause className="w-2.5 h-2.5" />Paused</>}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3" />Trigger: <span className="text-foreground/70 font-medium">{a.trigger}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-7 h-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>{a.active ? "Pause" : "Activate"}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        {[
                          { icon: BarChart3, label: "Actions", value: a.actions },
                          { icon: Users, label: "Enrolled", value: a.enrolled.toLocaleString() },
                          { icon: UserCheck, label: "Completed", value: a.completed.toLocaleString() },
                          { icon: TrendingUp, label: "Goal", value: a.goal },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><m.icon className="w-2.5 h-2.5" />{m.label}</div>
                            <span className="text-sm font-semibold text-foreground">{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Completion rate</span>
                          <span className={completionRate >= 70 ? "text-emerald-400" : completionRate >= 40 ? "text-amber-400" : "text-muted-foreground"}>{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
