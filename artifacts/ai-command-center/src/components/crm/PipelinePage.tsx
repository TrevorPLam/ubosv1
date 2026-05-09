/**
 * @file        artifacts/ai-command-center/src/components/crm/PipelinePage.tsx
 * @module      AI Command Center / CRM
 * @purpose     Visual sales pipeline board with deal stages, values, and win probability tracking
 *
 * @ai_instructions
 *   - Pipeline stages must follow standard sales workflow (prospecting → qualification → proposal → negotiation → closed).
 *   - Deal values should be formatted with proper currency formatting.
 *   - Win probability should be displayed as progress bars with percentages.
 *   - DO NOT modify pipeline structure without updating CRM API types.
 *
 * @exports     PipelinePage
 * @imports     wouter, lucide-react, @/lib/utils, @/components/ui/button, @/components/ui/card, @/components/ui/progress, @/components/ui/scroll-area
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import {
  ChevronRight, Plus, Filter, Clock, ArrowUpRight, TrendingUp,
  DollarSign, BarChart3, CheckCircle2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const pipelineStages = [
  {
    id: "prospecting", label: "Prospecting", color: "bg-slate-400",
    deals: [
      { id: 1, contact: "Omar Hassan", company: "Meridian Co", value: 8500, days: 2, probability: 15 },
      { id: 2, contact: "Liam O'Brien", company: "Orbital VC", value: 22000, days: 5, probability: 20 },
    ],
  },
  {
    id: "qualification", label: "Qualification", color: "bg-blue-400",
    deals: [
      { id: 3, contact: "Marcus Webb", company: "TechFlow", value: 35000, days: 8, probability: 35 },
      { id: 4, contact: "Priya Sharma", company: "NexusAI", value: 18000, days: 3, probability: 40 },
      { id: 5, contact: "Elena Vasquez", company: "CloudPeak", value: 47000, days: 11, probability: 30 },
    ],
  },
  {
    id: "proposal", label: "Proposal", color: "bg-violet-400",
    deals: [
      { id: 6, contact: "Sarah Chen", company: "Acme Corp", value: 120000, days: 14, probability: 60 },
      { id: 7, contact: "Yuki Tanaka", company: "Synth.jp", value: 85000, days: 7, probability: 65 },
    ],
  },
  {
    id: "negotiation", label: "Negotiation", color: "bg-amber-400",
    deals: [
      { id: 8, contact: "Ava Thompson", company: "VertexOps", value: 210000, days: 21, probability: 80 },
    ],
  },
  {
    id: "closed", label: "Closed Won", color: "bg-emerald-400",
    deals: [
      { id: 9, contact: "Yuki Tanaka", company: "Synth.jp", value: 60000, days: 30, probability: 100 },
      { id: 10, contact: "Ava Thompson", company: "VertexOps", value: 95000, days: 45, probability: 100 },
    ],
  },
];

const automations = [
  { name: "Deal Stale Reminder", trigger: "No activity for 7 days", enrolled: 56, active: true },
  { name: "Post-Demo Follow-up", trigger: "Meeting completed", enrolled: 128, active: true },
  { name: "Win/Loss Analysis", trigger: "Deal stage = Closed", enrolled: 74, active: false },
  { name: "Renewal Campaign", trigger: "Contract ends in 60d", enrolled: 31, active: true },
];

export function PipelinePage() {
  const totalPipeline = pipelineStages.flatMap((s) => s.deals).reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Pipeline</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Deal
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Total Pipeline", value: `$${(totalPipeline / 1000).toFixed(0)}K`, sub: "Across all stages", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Open Deals", value: "10", sub: "5 stages", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Weighted Value", value: "$312K", sub: "By probability", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Closed Won", value: "$155K", sub: "2 deals this quarter", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
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
        <ScrollArea className="flex-1 px-6 py-4">
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
                      <div key={deal.id} className="bg-card border border-border rounded-lg p-3 hover:border-primary/40 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-foreground leading-tight">{deal.contact}</div>
                            <div className="text-xs text-muted-foreground">{deal.company}</div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">${deal.value.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{deal.days}d
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Win prob.</span><span>{deal.probability}%</span>
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

        <div className="w-64 shrink-0 border-l border-border px-4 py-4 hidden xl:flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Deal Automations</CardTitle>
              <CardDescription className="text-[10px]">Running on pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {automations.map((a) => (
                <div key={a.name} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", a.active ? "bg-emerald-400" : "bg-muted-foreground")} />
                    <p className="text-xs font-medium leading-snug">{a.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-3">{a.trigger}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
