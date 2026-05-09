/**
 * @file        artifacts/ai-command-center/src/components/crm/CRMPage.tsx
 * @module      AI Command Center / CRM
 * @purpose     Main CRM dashboard page with navigation to all CRM modules
 *
 * @ai_instructions
 *   - Module cards should have consistent hover states and transitions.
 *   - Navigation links must use wouter for client-side routing.
 *   - Descriptions should be concise but informative for each module.
 *   - DO NOT modify module structure without updating routing configuration.
 *
 * @exports     CRMPage
 * @imports     wouter, @/components/ui/card, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, FileSignature, Mail, MessageSquare, BarChart2, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/crm/contacts",
    icon: Users,
    label: "Contacts",
    description: "Contact records, lead scoring, tags, activity history, and segmentation across your entire audience.",
  },
  {
    href: "/crm/pipeline",
    icon: TrendingUp,
    label: "Pipeline",
    description: "Visual deal board with stages, win probability, deal value tracking, and automated stage actions.",
  },
  {
    href: "/crm/agreements",
    icon: FileSignature,
    label: "Agreements",
    description: "Proposals, contracts, and engagements with e-signature, version control, and lifecycle management.",
  },
  {
    href: "/crm/email",
    icon: Mail,
    label: "Email",
    description: "Campaigns, sequences, automations, and AI-powered personalization with full performance reporting.",
  },
  {
    href: "/crm/sms",
    icon: MessageSquare,
    label: "SMS",
    description: "Broadcast and automated SMS with a two-way inbox, A2P compliance, and aggregate reporting.",
  },
  {
    href: "/crm/analytics",
    icon: BarChart2,
    label: "Analytics",
    description: "Campaign, automation, deal, and contact reporting with custom report builder and AI-driven insights.",
  },
];

export function CRMPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground mt-1">Contacts, pipeline, agreements, outreach, and analytics in one place.</p>
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
