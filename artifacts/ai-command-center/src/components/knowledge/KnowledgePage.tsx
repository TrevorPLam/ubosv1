/**
 * @file        artifacts/ai-command-center/src/components/knowledge/KnowledgePage.tsx
 * @module      AI Command Center / Knowledge Management
 * @purpose     Knowledge management hub with navigation to SOPs, wiki, training, and certifications
 *
 * @ai_instructions
 *   - Navigation cards should maintain consistent layout and hover states.
 *   - Icons must accurately represent their respective knowledge areas.
 *   - Descriptions should be concise yet informative for each sub-module.
 *   - DO NOT modify navigation structure without updating routing configuration.
 *
 * @exports     KnowledgePage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, BookOpen, GraduationCap, Award, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/knowledge/sops",
    icon: ListChecks,
    label: "SOPs",
    description: "Step-by-step standard operating procedures searchable by role or process, so the business runs on documented knowledge.",
  },
  {
    href: "/knowledge/wiki",
    icon: BookOpen,
    label: "Wiki",
    description: "Company handbook and internal reference where policies, org charts, benefits, and general knowledge live in a structured, searchable space.",
  },
  {
    href: "/knowledge/training",
    icon: GraduationCap,
    label: "Training",
    description: "Lightweight course builder where employees are assigned learning modules, complete them in order, and managers track progress.",
  },
  {
    href: "/knowledge/certifications",
    icon: Award,
    label: "Certifications",
    description: "Tracker to log earned certifications, link them to employee records, and alert both employee and manager when renewal is due.",
  },
];

export function KnowledgePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge</h1>
        <p className="text-muted-foreground mt-1">Capture, organize, and share everything the business knows — SOPs, policies, training, and credentials — in one place.</p>
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
