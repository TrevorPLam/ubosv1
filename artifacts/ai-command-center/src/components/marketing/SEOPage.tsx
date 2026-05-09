/**
 * @file        artifacts/ai-command-center/src/components/marketing/SEOPage.tsx
 * @module      AI Command Center / Marketing
 * @purpose     SEO management with keyword tracking, AI visibility monitoring, and site audits
 *
 * @ai_instructions
 *   - SEO data should include realistic keyword rankings and SERP feature data.
 *   - AI visibility tracking must monitor brand mentions across AI platforms.
 *   - Site audit should integrate with external tools (Semrush/Ahrefs).
 *   - DO NOT modify tracking logic without updating SEO monitoring system.
 *
 * @exports     SEOPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, TrendingDown, Minus, BarChart2, Eye, Globe, Zap, LayoutDashboard, Search } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Keyword Rank Tracker",
    description: "Tracks target keyword positions with historical trends, SERP feature detection (featured snippets, AI Overviews, knowledge panels), and competitor position monitoring.",
  },
  {
    icon: Eye,
    title: "AI Visibility Tracker",
    description: "Monitors brand mentions, citation frequency, and source trust scoring across ChatGPT, Gemini, Perplexity, and Google AI Overviews.",
  },
  {
    icon: Globe,
    title: "Site Audit",
    description: "Crawls for technical issues: broken links, missing meta tags, mobile usability, page speed, and structured data validation. Optionally connects to Semrush/Ahrefs.",
  },
  {
    icon: Zap,
    title: "Content Optimizer",
    description: "AI agent analyzes top-ranking pages for a target topic, then suggests on-page improvements covering structure, entity coverage, and AI-citation-worthiness factors.",
  },
  {
    icon: LayoutDashboard,
    title: "SEO Dashboard",
    description: "Unified view combining organic traffic, keyword rankings, AI visibility metrics, technical health score, and content performance in a single command center.",
  },
];

const keywords = [
  { keyword: "ai command center", position: 3, change: 2, volume: 2400 },
  { keyword: "marketing automation platform", position: 7, change: -1, volume: 8100 },
  { keyword: "ai agents for business", position: 12, change: 5, volume: 5400 },
  { keyword: "unified crm dashboard", position: 18, change: 0, volume: 3200 },
  { keyword: "brand compliance checker", position: 4, change: 3, volume: 1900 },
];

const aiVisibility = [
  { platform: "ChatGPT", mentions: 142, change: "+18%" },
  { platform: "Perplexity", mentions: 98, change: "+31%" },
  { platform: "Gemini", mentions: 67, change: "+9%" },
  { platform: "Google AI Overviews", mentions: 54, change: "+24%" },
];

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-green-500 text-xs font-medium"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs font-medium"><Minus className="w-3 h-3" />0</span>;
}

export function SEOPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">SEO</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SEO</h1>
        <p className="text-muted-foreground mt-1">Keyword tracking, AI visibility monitoring, site health, and content optimization.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organic Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48,320</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+14% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Keywords Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
            <p className="text-xs text-muted-foreground mt-1">Across 8 topics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Technical Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91/100</div>
            <p className="text-xs text-muted-foreground mt-1">4 issues open</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Mention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">361</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+21% MoM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Keyword Rankings</CardTitle>
              <CardDescription>Top tracked keywords and position changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                  <span className="col-span-2">Keyword</span>
                  <span className="text-center">Position</span>
                  <span className="text-right">Vol / Change</span>
                </div>
                {keywords.map((kw) => (
                  <div key={kw.keyword} className="grid grid-cols-4 items-center py-2.5 border-b border-border/50 last:border-0">
                    <span className="col-span-2 text-xs font-medium truncate pr-2">{kw.keyword}</span>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-xs font-bold w-8 justify-center">#{kw.position}</Badge>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-muted-foreground">{(kw.volume / 1000).toFixed(1)}k</span>
                      <ChangeIndicator change={kw.change} />
                    </div>
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
              <CardTitle className="text-sm">AI Platform Visibility</CardTitle>
              <CardDescription>Brand mentions this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiVisibility.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{platform.platform}</p>
                    <p className="text-[10px] text-muted-foreground">{platform.mentions} mentions</p>
                  </div>
                  <span className="text-xs font-medium text-green-500">{platform.change}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Site Audit Summary</CardTitle>
              <CardDescription>Latest crawl results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Pages Crawled", value: "1,842", ok: true },
                { label: "Broken Links", value: "2", ok: false },
                { label: "Missing Meta Tags", value: "1", ok: false },
                { label: "Mobile Usability", value: "Pass", ok: true },
                { label: "Structured Data", value: "Valid", ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={item.ok ? "text-foreground font-medium" : "text-red-500 font-medium"}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
