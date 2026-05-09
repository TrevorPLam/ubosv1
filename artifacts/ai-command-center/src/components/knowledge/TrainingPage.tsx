/**
 * @file        artifacts/ai-command-center/src/components/knowledge/TrainingPage.tsx
 * @module      AI Command Center / Knowledge Management
 * @purpose     Training course management with course builder, assignments, and progress tracking
 *
 * @ai_instructions
 *   - Course data should include realistic modules with sequential lesson structures.
 *   - Progress tracking must accurately reflect lesson completion states.
 *   - Assignment system should support individual, team, and role-based enrollment.
 *   - DO NOT modify course structure without updating progress calculation.
 *
 * @exports     TrainingPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, GraduationCap, ListOrdered, UserCheck, BarChart2, Bell, PlusCircle, CheckCircle2, Clock, Circle } from "lucide-react";

const features = [
  {
    icon: PlusCircle,
    title: "Course Builder",
    description: "Create learning modules from scratch using text, video embeds, and file attachments. Arrange lessons in a required order so content builds on itself.",
  },
  {
    icon: ListOrdered,
    title: "Ordered Completion",
    description: "Employees must complete each lesson in sequence before unlocking the next. Progress is saved so they can resume exactly where they left off.",
  },
  {
    icon: UserCheck,
    title: "Assignment & Enrollment",
    description: "Assign modules to individuals, teams, roles, or new hires automatically. Set due dates and make certain courses required for onboarding.",
  },
  {
    icon: BarChart2,
    title: "Manager Progress Visibility",
    description: "Managers and HR see a real-time view of who has started, who is in progress, and who has completed each module — filterable by team or course.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Employees receive reminders for incomplete modules as due dates approach. Managers are notified when someone on their team falls behind.",
  },
  {
    icon: CheckCircle2,
    title: "Completion Records",
    description: "Every completed module is logged with a timestamp and stored against the employee record, providing a full training history.",
  },
];

const assignments = [
  { name: "Sarah Chen", module: "Security Awareness 2026", progress: "complete", due: "May 1, 2026" },
  { name: "Marcus Rivera", module: "Engineering Standards", progress: "in-progress", due: "May 15, 2026" },
  { name: "Priya Nair", module: "Brand & Messaging", progress: "in-progress", due: "May 20, 2026" },
  { name: "Tom Okafor", module: "Design System 101", progress: "not-started", due: "May 30, 2026" },
  { name: "Elena Volkov", module: "Financial Controls", progress: "complete", due: "Apr 30, 2026" },
];

function ProgressBadge({ progress }: { progress: string }) {
  if (progress === "complete") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>;
  if (progress === "in-progress") return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 shrink-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
  return <Badge variant="outline" className="text-muted-foreground shrink-0"><Circle className="w-3 h-3 mr-1" />Not Started</Badge>;
}

export function TrainingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/knowledge" className="hover:text-foreground transition-colors">Knowledge</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Training</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Training</h1>
        <p className="text-muted-foreground mt-1">Assign learning modules, track ordered completion, and give managers full visibility into team progress.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">Published courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">143</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">37</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">5</div>
            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
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
              <CardTitle className="text-sm">Recent Assignments</CardTitle>
              <CardDescription>Employee progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.map((a) => (
                <div key={a.name + a.module} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{a.module} · Due {a.due}</p>
                  </div>
                  <ProgressBadge progress={a.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
