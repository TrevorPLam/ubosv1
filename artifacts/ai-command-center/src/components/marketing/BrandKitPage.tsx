/**
 * @file        artifacts/ai-command-center/src/components/marketing/BrandKitPage.tsx
 * @module      AI Command Center / Marketing
 * @purpose     Brand kit management with identity repository, voice guidelines, and asset templates
 *
 * @ai_instructions
 *   - Brand data should include realistic identity assets and guideline information.
 *   - Status badges should accurately reflect asset availability and approval states.
 *   - Asset repository must support multiple formats and variants.
 *   - DO NOT modify brand structure without updating asset management system.
 *
 * @exports     BrandKitPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Palette, MessageSquare, ShieldCheck, LayoutTemplate, Archive, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Brand Identity Repository",
    description: "Central, structured storage for logos (all variants/formats), color palettes (hex/RGB/CMYK), typography specs, iconography, and imagery guidelines.",
    status: "active",
  },
  {
    icon: MessageSquare,
    title: "Voice & Tone Guidelines",
    description: "Documented brand voice characteristics, tone matrices by channel/audience, approved messaging frameworks, key terminology, and anti-patterns for AI agents.",
    status: "active",
  },
  {
    icon: ShieldCheck,
    title: "Brand Compliance Checker",
    description: "Automatically checks all AI-generated content against voice/tone/visual rules before publishing. Routes flagged content to the human approval queue.",
    status: "active",
  },
  {
    icon: LayoutTemplate,
    title: "Template Library",
    description: "Version-controlled library of email templates, social post templates, proposals, presentation decks, and letterhead locked to brand standards.",
    status: "active",
  },
  {
    icon: Archive,
    title: "Digital Asset Management",
    description: "Asset tagging, version history, usage rights tracking, and expiration alerts to prevent outdated or unlicensed assets from appearing in campaigns.",
    status: "active",
  },
];

const colorPalette = [
  { name: "Primary", hex: "#6366F1", rgb: "99, 102, 241" },
  { name: "Secondary", hex: "#8B5CF6", rgb: "139, 92, 246" },
  { name: "Accent", hex: "#EC4899", rgb: "236, 72, 153" },
  { name: "Neutral", hex: "#64748B", rgb: "100, 116, 139" },
];

const recentAssets = [
  { name: "Logo_Primary_Dark.svg", type: "Logo", expires: null, status: "active" },
  { name: "Brand_Guide_v3.pdf", type: "Guide", expires: "2026-12-01", status: "active" },
  { name: "Social_Banner_Q2.png", type: "Image", expires: "2026-06-30", status: "expiring" },
  { name: "Email_Header_v2.png", type: "Image", expires: "2025-03-01", status: "expired" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
  if (status === "expiring") return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
}

export function BrandKitPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Brand Kit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Kit</h1>
        <p className="text-muted-foreground mt-1">Central repository for brand identity, voice guidelines, and compliant asset management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">Version-controlled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Content passing checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Color Palette</CardTitle>
              <CardDescription>Active brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {colorPalette.map((color) => (
                <div key={color.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md border border-border shrink-0" style={{ backgroundColor: color.hex }} />
                  <div>
                    <p className="text-xs font-medium">{color.name}</p>
                    <p className="text-[10px] text-muted-foreground">{color.hex}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Assets</CardTitle>
              <CardDescription>Latest uploads & status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssets.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{asset.type}</p>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
