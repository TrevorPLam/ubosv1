/**
 * @file        artifacts/ai-command-center/src/components/marketing/ContentManagementPage.tsx
 * @module      AI Command Center / Marketing
 * @purpose     Content management with calendar, brief generator, and production workflow
 *
 * @ai_instructions
 *   - Content data should include realistic calendar events and brief information.
 *   - Production workflow must support drag-and-drop and stage transitions.
 *   - AI brief generation should integrate with SEO and brand guidelines.
 *   - DO NOT modify workflow stages without updating production logic.
 *
 * @exports     ContentManagementPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CalendarDays, FileSearch, KanbanSquare, Archive, Bot, TrendingUp } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Content Calendar",
    description: "Visual calendar of all content (blog, social, email, landing pages, video, podcast) color-coded by type, status, and campaign. Supports drag-and-drop rescheduling and dependency tracking.",
  },
  {
    icon: FileSearch,
    title: "Content Brief Generator",
    description: "AI agent creates SEO-informed briefs from keyword data, competitor analysis, and brand guidelines — including target keyword, semantic entities, outline, linking strategy, and voice/tone reminders.",
  },
  {
    icon: KanbanSquare,
    title: "Production Workflow",
    description: "Kanban/list view of content stages (Ideation → Briefed → Drafting → Review → Approved → Published → Analyzing). AI agents auto-advance based on rules; reviews flow through the attention queue.",
  },
  {
    icon: Archive,
    title: "Content Repository",
    description: "Searchable, filterable library of all content with attached performance metrics (traffic, rankings, conversions, shares, revenue influenced) and full version history.",
  },
  {
    icon: Bot,
    title: "AI Content Assistant",
    description: "Generates drafts, suggests headlines, rewrites for different tones/channels, expands outlines, and repurposes content across formats — governed by the Brand Kit's voice/tone rules.",
  },
];

type Stage = "Ideation" | "Briefed" | "Drafting" | "Review" | "Approved" | "Published";

const contentItems: { title: string; type: string; stage: Stage; assignee: string; due: string }[] = [
  { title: "The Rise of Agentic Marketing", type: "Blog", stage: "Drafting", assignee: "AI Agent", due: "May 12" },
  { title: "Q2 Email Newsletter", type: "Email", stage: "Review", assignee: "Sarah M.", due: "May 9" },
  { title: "LinkedIn Carousel: AI Agents 101", type: "Social", stage: "Approved", assignee: "AI Agent", due: "May 8" },
  { title: "Command Center Landing Page Copy", type: "Landing", stage: "Briefed", assignee: "Tom K.", due: "May 15" },
  { title: "Brand Story Video Script", type: "Video", stage: "Ideation", assignee: "AI Agent", due: "May 22" },
  { title: "SEO Guide: AI Visibility in 2026", type: "Blog", stage: "Published", assignee: "AI Agent", due: "May 1" },
];

const stageBadgeMap: Record<Stage, string> = {
  Ideation: "text-muted-foreground border-border bg-muted/30",
  Briefed: "text-blue-500 border-blue-500/30 bg-blue-500/10",
  Drafting: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  Review: "text-purple-500 border-purple-500/30 bg-purple-500/10",
  Approved: "text-green-500 border-green-500/30 bg-green-500/10",
  Published: "text-foreground border-border bg-accent/40",
};

const typeBadgeMap: Record<string, string> = {
  Blog: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  Email: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  Social: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  Landing: "text-teal-400 border-teal-400/30 bg-teal-400/10",
  Video: "text-red-400 border-red-400/30 bg-red-400/10",
};

export function ContentManagementPage() {
  const stageCounts = contentItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.stage] = (acc[item.stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Content Management</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground mt-1">Plan, produce, publish, and measure all content from a single production hub.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">648</div>
            <p className="text-xs text-muted-foreground mt-1">Across all formats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stageCounts["Briefed"] || 0) + (stageCounts["Drafting"] || 0) + (stageCounts["Review"] || 0) + (stageCounts["Ideation"] || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Active pipeline items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+8 vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI-Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">71%</div>
            <p className="text-xs text-muted-foreground mt-1">Of all drafts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Production Pipeline</CardTitle>
              <CardDescription>Current content items and their workflow stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <div className="grid grid-cols-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                  <span className="col-span-2">Title</span>
                  <span>Type</span>
                  <span>Stage</span>
                  <span className="text-right">Due</span>
                </div>
                {contentItems.map((item) => (
                  <div key={item.title} className="grid grid-cols-5 items-center py-2.5 border-b border-border/50 last:border-0 gap-1">
                    <span className="col-span-2 text-xs font-medium truncate pr-2">{item.title}</span>
                    <Badge variant="outline" className={`text-[10px] w-fit ${typeBadgeMap[item.type] || ""}`}>{item.type}</Badge>
                    <Badge variant="outline" className={`text-[10px] w-fit ${stageBadgeMap[item.stage]}`}>{item.stage}</Badge>
                    <span className="text-xs text-muted-foreground text-right">{item.due}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pipeline by Stage</CardTitle>
              <CardDescription>Content count per workflow stage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["Ideation", "Briefed", "Drafting", "Review", "Approved", "Published"] as Stage[]).map((stage) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="flex-1 flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${stageBadgeMap[stage]}`}>{stage}</Badge>
                    <span className="text-xs font-bold">{stageCounts[stage] || 0}</span>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.min(((stageCounts[stage] || 0) / contentItems.length) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Performing Content</CardTitle>
              <CardDescription>By attributed revenue this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "AI Agents for Sales Teams", revenue: "$18.4k", type: "Blog" },
                { title: "Command Center Demo Video", revenue: "$14.1k", type: "Video" },
                { title: "Q1 Nurture Email Sequence", revenue: "$11.8k", type: "Email" },
                { title: "SEO vs GEO in 2026", revenue: "$9.3k", type: "Blog" },
              ].map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <Badge variant="outline" className={`text-[10px] mt-0.5 ${typeBadgeMap[item.type] || ""}`}>{item.type}</Badge>
                  </div>
                  <span className="text-xs font-bold text-green-500 shrink-0">{item.revenue}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
