import { useState } from "react";
import {
  Users,
  TrendingUp,
  Mail,
  Zap,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  ChevronDown,
  Star,
  Tag,
  Phone,
  Globe,
  Clock,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Flame,
  MessageSquare,
  Send,
  Eye,
  MousePointerClick,
  Play,
  Pause,
  BarChart3,
  UserCheck,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const contacts = [
  { id: 1, name: "Sarah Chen", email: "sarah.chen@acme.com", company: "Acme Corp", score: 92, status: "hot", tags: ["Enterprise", "Decision Maker"], lastActivity: "2h ago", deals: 2, phone: "+1 415 555 0101" },
  { id: 2, name: "Marcus Webb", email: "m.webb@techflow.io", company: "TechFlow", score: 78, status: "warm", tags: ["Mid-Market", "Evaluating"], lastActivity: "5h ago", deals: 1, phone: "+1 628 555 0182" },
  { id: 3, name: "Priya Sharma", email: "priya@nexusai.com", company: "NexusAI", score: 65, status: "warm", tags: ["Startup", "Champion"], lastActivity: "1d ago", deals: 1, phone: "+1 510 555 0149" },
  { id: 4, name: "Liam O'Brien", email: "liam@orbitalvc.com", company: "Orbital VC", score: 54, status: "cold", tags: ["Investor", "Influencer"], lastActivity: "3d ago", deals: 0, phone: "+1 212 555 0198" },
  { id: 5, name: "Yuki Tanaka", email: "y.tanaka@synth.jp", company: "Synth.jp", score: 88, status: "hot", tags: ["Enterprise", "Renewal"], lastActivity: "30m ago", deals: 3, phone: "+81 3 5555 0123" },
  { id: 6, name: "Elena Vasquez", email: "elena@cloudpeak.io", company: "CloudPeak", score: 71, status: "warm", tags: ["Mid-Market", "Pilot"], lastActivity: "1d ago", deals: 1, phone: "+1 303 555 0167" },
  { id: 7, name: "Omar Hassan", email: "o.hassan@meridian.co", company: "Meridian Co", score: 43, status: "cold", tags: ["SMB", "New Lead"], lastActivity: "5d ago", deals: 0, phone: "+1 202 555 0114" },
  { id: 8, name: "Ava Thompson", email: "ava.t@vertexops.com", company: "VertexOps", score: 95, status: "hot", tags: ["Enterprise", "Champion"], lastActivity: "1h ago", deals: 4, phone: "+1 415 555 0176" },
];

const pipelineStages = [
  {
    id: "prospecting",
    label: "Prospecting",
    color: "bg-slate-400",
    deals: [
      { id: 1, contact: "Omar Hassan", company: "Meridian Co", value: 8500, days: 2, probability: 15 },
      { id: 2, contact: "Liam O'Brien", company: "Orbital VC", value: 22000, days: 5, probability: 20 },
    ],
  },
  {
    id: "qualification",
    label: "Qualification",
    color: "bg-blue-400",
    deals: [
      { id: 3, contact: "Marcus Webb", company: "TechFlow", value: 35000, days: 8, probability: 35 },
      { id: 4, contact: "Priya Sharma", company: "NexusAI", value: 18000, days: 3, probability: 40 },
      { id: 5, contact: "Elena Vasquez", company: "CloudPeak", value: 47000, days: 11, probability: 30 },
    ],
  },
  {
    id: "proposal",
    label: "Proposal",
    color: "bg-violet-400",
    deals: [
      { id: 6, contact: "Sarah Chen", company: "Acme Corp", value: 120000, days: 14, probability: 60 },
      { id: 7, contact: "Yuki Tanaka", company: "Synth.jp", value: 85000, days: 7, probability: 65 },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "bg-amber-400",
    deals: [
      { id: 8, contact: "Ava Thompson", company: "VertexOps", value: 210000, days: 21, probability: 80 },
    ],
  },
  {
    id: "closed",
    label: "Closed Won",
    color: "bg-emerald-400",
    deals: [
      { id: 9, contact: "Yuki Tanaka", company: "Synth.jp", value: 60000, days: 30, probability: 100 },
      { id: 10, contact: "Ava Thompson", company: "VertexOps", value: 95000, days: 45, probability: 100 },
    ],
  },
];

const campaigns = [
  { id: 1, name: "Q2 Product Launch", type: "Email", status: "active", sent: 4820, opens: 1734, clicks: 412, conversions: 38, openRate: 35.9, clickRate: 23.8, sentDate: "May 2, 2026" },
  { id: 2, name: "Re-engagement Series", type: "Sequence", status: "active", sent: 1240, opens: 386, clicks: 97, conversions: 12, openRate: 31.1, clickRate: 25.1, sentDate: "Apr 28, 2026" },
  { id: 3, name: "Enterprise Nurture Flow", type: "Automation", status: "active", sent: 890, opens: 401, clicks: 134, conversions: 22, openRate: 45.1, clickRate: 33.4, sentDate: "Ongoing" },
  { id: 4, name: "Churn Prevention", type: "Email", status: "paused", sent: 310, opens: 102, clicks: 18, conversions: 4, openRate: 32.9, clickRate: 17.6, sentDate: "Apr 15, 2026" },
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

const statCards = [
  { label: "Total Contacts", value: "3,847", change: "+124 this month", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Open Deals", value: "$537K", change: "+$42K this week", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Campaigns Active", value: "4", change: "12.4K recipients", icon: Mail, color: "text-violet-400", bg: "bg-violet-400/10" },
  { label: "Automations Running", value: "5", change: "2,300 enrolled", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400 bg-emerald-400/10" :
    score >= 60 ? "text-amber-400 bg-amber-400/10" :
    "text-slate-400 bg-slate-400/10";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
      <Flame className="w-3 h-3" />
      {score}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    hot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]",
    warm: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]",
    cold: "bg-slate-400",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", colors[status] ?? "bg-slate-400")} />;
}

function ContactsTab() {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
        <Button size="sm" className="gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Last Activity</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Deals</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer",
                    i % 2 === 0 ? "" : "bg-muted/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StatusDot status={c.status} />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {c.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company}</td>
                  <td className="px-4 py-3"><ScoreBadge score={c.score} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.lastActivity}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-foreground">{c.deals}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Mail className="w-3.5 h-3.5 mr-2" />Send Email</DropdownMenuItem>
                        <DropdownMenuItem><Phone className="w-3.5 h-3.5 mr-2" />Log Call</DropdownMenuItem>
                        <DropdownMenuItem><Star className="w-3.5 h-3.5 mr-2" />Add to Sequence</DropdownMenuItem>
                        <DropdownMenuItem><Tag className="w-3.5 h-3.5 mr-2" />Edit Tags</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground pt-2 px-1">{filtered.length} of {contacts.length} contacts</div>
      </ScrollArea>
    </div>
  );
}

function PipelineTab() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> Add Deal
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total pipeline value:</span>
          <span className="text-sm font-semibold text-emerald-400">$700,500</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex gap-3 pb-4" style={{ minWidth: "fit-content" }}>
          {pipelineStages.map((stage) => {
            const total = stage.deals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage.id} className="flex flex-col gap-2 w-56 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                    <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">${(total / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex flex-col gap-2">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-card border border-border rounded-lg p-3 hover:border-primary/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-foreground leading-tight">{deal.contact}</div>
                          <div className="text-xs text-muted-foreground">{deal.company}</div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          ${deal.value.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {deal.days}d
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Win prob.</span>
                          <span>{deal.probability}%</span>
                        </div>
                        <Progress value={deal.probability} className="h-1" />
                      </div>
                    </div>
                  ))}
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-md hover:bg-muted/30 w-full">
                    <Plus className="w-3.5 h-3.5" /> Add deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function CampaignsTab() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> Create Campaign
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.type}</Badge>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        c.status === "active"
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-amber-400 bg-amber-400/10"
                      )}
                    >
                      {c.status === "active" ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {c.sentDate}
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

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Send className="w-3 h-3" />Sent</span>
                  <span className="font-semibold text-foreground text-sm">{c.sent.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Eye className="w-3 h-3" />Open Rate</span>
                  <span className="font-semibold text-sm" style={{ color: c.openRate > 40 ? "rgb(52,211,153)" : c.openRate > 25 ? "rgb(251,191,36)" : "rgb(148,163,184)" }}>
                    {c.openRate}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MousePointerClick className="w-3 h-3" />Click Rate</span>
                  <span className="font-semibold text-sm" style={{ color: c.clickRate > 30 ? "rgb(52,211,153)" : c.clickRate > 20 ? "rgb(251,191,36)" : "rgb(148,163,184)" }}>
                    {c.clickRate}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3" />Conversions</span>
                  <span className="font-semibold text-foreground text-sm">{c.conversions}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Opens</span><span>{Math.round((c.opens / c.sent) * 100)}%</span>
                  </div>
                  <Progress value={(c.opens / c.sent) * 100} className="h-1" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Clicks</span><span>{Math.round((c.clicks / c.opens) * 100)}%</span>
                  </div>
                  <Progress value={(c.clicks / c.opens) * 100} className="h-1" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Conversions</span><span>{Math.round((c.conversions / c.sent) * 100)}%</span>
                  </div>
                  <Progress value={(c.conversions / c.sent) * 100} className="h-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function AutomationsTab() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> New Automation
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {automations.map((a) => {
            const completionRate = Math.round((a.completed / a.enrolled) * 100);
            return (
              <div
                key={a.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      a.active ? "bg-emerald-400/10" : "bg-muted"
                    )}>
                      <Zap className={cn("w-4 h-4", a.active ? "text-emerald-400" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground">{a.name}</span>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1",
                          a.active ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-muted"
                        )}>
                          {a.active ? <><Activity className="w-2.5 h-2.5" />Active</> : <><Pause className="w-2.5 h-2.5" />Paused</>}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Trigger: <span className="text-foreground/70 font-medium">{a.trigger}</span>
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
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="w-2.5 h-2.5" />Actions</div>
                    <span className="text-sm font-semibold text-foreground">{a.actions}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-2.5 h-2.5" />Enrolled</div>
                    <span className="text-sm font-semibold text-foreground">{a.enrolled.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Completed</div>
                    <span className="text-sm font-semibold text-foreground">{a.completed.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />Goal</div>
                    <span className="text-xs text-foreground/70 font-medium">{a.goal}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Completion rate</span>
                    <span className={completionRate >= 70 ? "text-emerald-400" : completionRate >= 40 ? "text-amber-400" : "text-muted-foreground"}>
                      {completionRate}%
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function CRMPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">CRM</h1>
          <p className="text-xs text-muted-foreground">Contacts, pipeline, campaigns, and automations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Globe className="w-3.5 h-3.5" />
            Import
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />
            New
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground leading-tight">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{card.change}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-4">
        <Tabs defaultValue="contacts" className="flex flex-col h-full">
          <TabsList className="w-fit shrink-0 mb-4">
            <TabsTrigger value="contacts" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
              <Mail className="w-3.5 h-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" /> Automations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contacts" className="flex-1 overflow-hidden mt-0">
            <ContactsTab />
          </TabsContent>
          <TabsContent value="pipeline" className="flex-1 overflow-hidden mt-0">
            <PipelineTab />
          </TabsContent>
          <TabsContent value="campaigns" className="flex-1 overflow-hidden mt-0">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="automations" className="flex-1 overflow-hidden mt-0">
            <AutomationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
