/**
 * @file        artifacts/ai-command-center/src/components/knowledge/WikiPage.tsx
 * @module      AI Command Center / Knowledge Management
 * @purpose     Company wiki and handbook with structured content, search, and organization charts
 *
 * @ai_instructions
 *   - Wiki content should include realistic policy and organizational information.
 *   - Search functionality must work across all articles, headings, and paragraphs.
 *   - Org charts should automatically reflect team directory reporting lines.
 *   - DO NOT modify wiki structure without updating content management system.
 *
 * @exports     WikiPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Search, GitBranch, Users, LayoutList, Lock, FolderOpen } from "lucide-react";

const features = [
  {
    icon: LayoutList,
    title: "Structured Handbook",
    description: "Organize knowledge into sections — policies, benefits, org structure, processes — with a navigable table of contents that scales as the company grows.",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description: "Instant search across every article, heading, and paragraph so anyone can find the answer to any question without knowing which section to look in.",
  },
  {
    icon: FolderOpen,
    title: "Org Charts & Hierarchies",
    description: "Visual organization charts embedded directly in the wiki, automatically reflecting reporting lines from the Team directory.",
  },
  {
    icon: Users,
    title: "Team-Wide Access",
    description: "Every employee and contractor can read the wiki from day one. Role-specific sections are visible only to the relevant team.",
  },
  {
    icon: GitBranch,
    title: "Revision History",
    description: "Every change is logged with author, timestamp, and a diff view. Revert any article to any prior version with one click.",
  },
  {
    icon: Lock,
    title: "Edit Permissions",
    description: "Designate article owners and editors per section. Sensitive policies require manager approval before changes go live.",
  },
];

const articles = [
  { title: "Code of Conduct", section: "Policies", updated: "Apr 2026", views: 142 },
  { title: "Benefits Overview", section: "Benefits", updated: "Jan 2026", views: 218 },
  { title: "Engineering Org Chart", section: "Org Structure", updated: "Mar 2026", views: 89 },
  { title: "Remote Work Policy", section: "Policies", updated: "Feb 2026", views: 176 },
  { title: "Expense Reimbursement", section: "Finance", updated: "Nov 2025", views: 61 },
];

export function WikiPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/knowledge" className="hover:text-foreground transition-colors">Knowledge</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Wiki</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Wiki</h1>
        <p className="text-muted-foreground mt-1">Company handbook and internal reference — policies, org charts, benefits, and general knowledge in one searchable place.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground mt-1">Across all sections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Top-level categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Views This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-muted-foreground mt-1">Across all articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stale Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">6</div>
            <p className="text-xs text-muted-foreground mt-1">Not updated in 6+ months</p>
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
              <CardTitle className="text-sm">Most Viewed Articles</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {articles.map((article) => (
                <div key={article.title} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{article.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{article.section} · {article.updated}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">{article.views}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
