/**
 * @file        artifacts/ai-command-center/src/components/team/TeamPage.tsx
 * @module      AI Command Center / Team Management
 * @purpose     Team management hub with navigation to directory, onboarding, offboarding, and compliance
 *
 * @ai_instructions
 *   - Navigation cards should maintain consistent layout and hover states.
 *   - Icons must accurately represent their respective team management areas.
 *   - Descriptions should be concise yet informative for each sub-module.
 *   - DO NOT modify navigation structure without updating routing configuration.
 *
 * @exports     TeamPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardList, LogOut, CalendarOff, FileText, ShieldCheck, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/team/directory",
    icon: Users,
    label: "Directory",
    description: "Searchable record for every employee and contractor with contact details, role, compensation, and key documents.",
  },
  {
    href: "/team/onboarding",
    icon: ClipboardList,
    label: "Onboarding",
    description: "Checklist-driven workflow to prepare paperwork, assign training, and set up system access for new hires.",
  },
  {
    href: "/team/offboarding",
    icon: LogOut,
    label: "Offboarding",
    description: "Structured process to revoke access, collect assets, schedule final payments, and conduct exit tasks.",
  },
  {
    href: "/team/time-off",
    icon: CalendarOff,
    label: "Time Off",
    description: "Request-and-approval system for vacation, sick leave, and absences with a shared calendar view.",
  },
  {
    href: "/team/documents",
    icon: FileText,
    label: "Documents",
    description: "Centralized repository for offer letters, contracts, performance reviews, and signed policies per person.",
  },
  {
    href: "/team/compliance",
    icon: ShieldCheck,
    label: "Compliance Tracking",
    description: "Log of required certifications, license expirations, and mandatory training completions with automated reminders.",
  },
];

export function TeamPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground mt-1">Manage your people — from hiring to offboarding, time off, and compliance — in one place.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subPages.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                    <page.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{page.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
