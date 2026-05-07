import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, FileSignature, Plus, Filter, MoreHorizontal,
  Eye, Clock, CheckCircle2, XCircle, AlertCircle, Send,
  PenLine, RefreshCw, ShieldCheck, Layers, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const features = [
  {
    icon: PenLine,
    title: "Drag-and-Drop Document Builder",
    description: "Visual editor with layout containers and content blocks — text, images, video, tables, pricing tables, signatures, and client input forms. Real-time preview as you build.",
  },
  {
    icon: Layers,
    title: "Interactive Pricing Tables",
    description: "Prospects select quantities, toggle add-ons, and choose packages with totals updating in real time. Supports tiered pricing, volume discounts, and recurring billing.",
  },
  {
    icon: ShieldCheck,
    title: "E-Signature",
    description: "Signature fields placed directly in the document. Signers open via magic link and sign in-browser. Legally binding with IP, timestamp, and device fingerprint capture.",
  },
  {
    icon: RefreshCw,
    title: "Lifecycle Management",
    description: "Full version control with timestamps and author attribution. Status workflow from Draft through Signed. Auto-reminders for unopened or unsigned proposals.",
  },
  {
    icon: Eye,
    title: "Engagement Tracking",
    description: "Real-time open notifications, page-by-page analytics showing time spent per section, and engagement scoring to prioritize follow-ups.",
  },
  {
    icon: Sparkles,
    title: "AI Generation",
    description: "Generate complete proposals from a website URL and prompt — structured sections, professional formatting, and personalized content in minutes.",
  },
];

const agreements = [
  {
    id: "AGR-0018",
    title: "Enterprise Platform Agreement",
    contact: "Ava Thompson",
    company: "VertexOps",
    value: "$210,000",
    status: "signed",
    sent: "Apr 30, 2026",
    opened: "12 times",
    engagementScore: 94,
  },
  {
    id: "AGR-0017",
    title: "Q2 Consulting Engagement",
    contact: "Sarah Chen",
    company: "Acme Corp",
    value: "$120,000",
    status: "viewed",
    sent: "May 3, 2026",
    opened: "4 times",
    engagementScore: 71,
  },
  {
    id: "AGR-0016",
    title: "Software License Proposal",
    contact: "Yuki Tanaka",
    company: "Synth.jp",
    value: "$85,000",
    status: "sent",
    sent: "May 5, 2026",
    opened: "1 time",
    engagementScore: 42,
  },
  {
    id: "AGR-0015",
    title: "Mid-Market Growth Package",
    contact: "Marcus Webb",
    company: "TechFlow",
    value: "$35,000",
    status: "draft",
    sent: "—",
    opened: "—",
    engagementScore: 0,
  },
  {
    id: "AGR-0014",
    title: "Pilot Program Contract",
    contact: "Elena Vasquez",
    company: "CloudPeak",
    value: "$47,000",
    status: "expired",
    sent: "Mar 15, 2026",
    opened: "3 times",
    engagementScore: 38,
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    signed: { label: "Signed", icon: CheckCircle2, cls: "text-green-500 border-green-500/30 bg-green-500/10" },
    viewed: { label: "Viewed", icon: Eye, cls: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
    sent: { label: "Sent", icon: Send, cls: "text-violet-500 border-violet-500/30 bg-violet-500/10" },
    draft: { label: "Draft", icon: PenLine, cls: "text-muted-foreground border-muted" },
    expired: { label: "Expired", icon: XCircle, cls: "text-red-500 border-red-500/30 bg-red-500/10" },
  };
  const m = map[status] ?? map.draft;
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", m.cls)}>
      <m.icon className="w-3 h-3 mr-1" />{m.label}
    </Badge>
  );
}

function EngagementBar({ score }: { score: number }) {
  if (score === 0) return <span className="text-[10px] text-muted-foreground">—</span>;
  const color = score >= 70 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{score}</span>
    </div>
  );
}

export function AgreementsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Agreements</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Agreements</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Agreement
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: "41", sub: "This quarter", icon: Send, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Awaiting Signature", value: "6", sub: "Open proposals", icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Signed This Month", value: "8", sub: "$412K closed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Avg. Time to Sign", value: "3.2d", sub: "From first open", icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10" },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground leading-tight">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
          <ScrollArea className="flex-1">
            <div className="rounded-md border border-border overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Agreement</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Sent</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Engagement</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a, i) => (
                    <tr key={a.id} className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer", i % 2 === 0 ? "" : "bg-muted/5")}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-sm">{a.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{a.id}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs font-medium">{a.contact}</div>
                        <div className="text-[10px] text-muted-foreground">{a.company}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm">{a.value}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{a.sent}</td>
                      <td className="px-4 py-3 hidden xl:table-cell w-32"><EngagementBar score={a.engagementScore} /></td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-7 h-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View</DropdownMenuItem>
                            <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        <div className="w-72 shrink-0 border-l border-border px-4 py-4 hidden xl:flex flex-col gap-3 overflow-y-auto">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capabilities</h2>
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
                  <feature.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-0.5">{feature.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
