/**
 * @file        artifacts/ai-command-center/src/components/settings/SettingsPage.tsx
 * @module      AI Command Center / Settings
 * @purpose     Settings dashboard hub with navigation to cost analytics, audit log, and data management
 *
 * @ai_instructions
 *   - Navigation cards should maintain consistent layout and hover states.
 *   - Icons must accurately represent their respective settings areas.
 *   - Descriptions should be concise yet informative for each sub-module.
 *   - DO NOT modify navigation structure without updating routing configuration.
 *
 * @exports     SettingsPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Activity, Database, Blocks, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/settings/cost-analytics",
    icon: LineChart,
    label: "Cost Analytics",
    description: "Monitor infrastructure and token usage costs.",
  },
  {
    href: "/settings/audit-log",
    icon: Activity,
    label: "Audit Log",
    description: "Review system events and agent activity history.",
  },
  {
    href: "/settings/memory",
    icon: Database,
    label: "Memory",
    description: "Manage the knowledge base and RAG document store.",
  },
  {
    href: "/settings/integrations",
    icon: Blocks,
    label: "Integrations",
    description: "Configure MCP servers and third-party tool connections.",
  },
];

export function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your command center experience.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">System</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the UI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Force dark theme across the application.</p>
            </div>
            <Switch checked={true} disabled /> {/* Hardcoded per reqs */}
          </div>
          
          <div className="space-y-3">
            <Label>Interface Density</Label>
            <Select defaultValue="compact">
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact (Recommended)</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Defaults</CardTitle>
          <CardDescription>Default settings for newly spawned agents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Default Reasoning Model</Label>
            <Select defaultValue="gpt-4o">
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="gemini-1-5-pro">Gemini 1.5 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Approval for Destructive Actions</Label>
              <p className="text-sm text-muted-foreground">Force items to the Attention Queue instead of auto-executing.</p>
            </div>
            <Switch checked={true} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
