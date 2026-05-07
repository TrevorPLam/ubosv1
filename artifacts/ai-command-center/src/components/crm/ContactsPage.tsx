import { useState } from "react";
import { Link } from "wouter";
import {
  Users, Search, Plus, Filter, MoreHorizontal, ChevronRight,
  Mail, Phone, Star, Tag, Clock, Flame, Zap, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const automations = [
  { name: "Lead Scoring Engine", trigger: "Contact created", enrolled: 1842, active: true },
  { name: "Hot Lead Alert", trigger: "Score exceeds 85", enrolled: 243, active: true },
  { name: "Post-Demo Follow-up", trigger: "Meeting completed", enrolled: 128, active: true },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-400/10" : score >= 60 ? "text-amber-400 bg-amber-400/10" : "text-slate-400 bg-slate-400/10";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
      <Flame className="w-3 h-3" />{score}
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

export function ContactsPage() {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Contacts</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Contacts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Total Contacts", value: "3,847", sub: "+124 this month", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Hot Leads", value: "3", sub: "Score ≥ 85", icon: Flame, color: "text-red-400", bg: "bg-red-400/10" },
            { label: "Open Deals", value: "$537K", sub: "+$42K this week", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search contacts…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
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
                    <tr key={c.id} className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer", i % 2 === 0 ? "" : "bg-muted/5")}>
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
                          {c.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
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

        <div className="w-64 shrink-0 border-l border-border px-4 py-4 hidden xl:flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Active Automations</CardTitle>
              <CardDescription className="text-[10px]">Running on contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {automations.map((a) => (
                <div key={a.name} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-xs font-medium leading-snug">{a.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-3">{a.enrolled.toLocaleString()} enrolled</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
