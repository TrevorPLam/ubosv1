/**
 * @file        artifacts/ai-command-center/src/components/analytics/CostAnalyticsPage.tsx
 * @module      AI Command Center / Analytics
 * @purpose     Page component displaying cost analytics with charts and metrics for agent operations
 *
 * @ai_instructions
 *   - Cost data must be formatted using the proper currency formatter.
 *   - Charts should use responsive containers for proper scaling.
 *   - All monetary values should be displayed consistently.
 *   - DO NOT modify chart data structure without updating useCostSummary hook.
 *
 * @exports     CostAnalyticsPage
 * @imports     wouter, @/hooks/useCostSummary, recharts, @/lib/formatters, @/components/ui/card, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { useCostSummary } from "@/hooks/useCostSummary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, Cpu, Server, ChevronRight } from "lucide-react";

export function CostAnalyticsPage() {
  const { data: costData } = useCostSummary();

  if (!costData) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-full">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Cost Analytics</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
        <p className="text-muted-foreground mt-1">Token usage and operational expenses across the fleet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Spend (MTD)</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costData.total)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg Daily Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costData.total / 30)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Highest Spend Agent</CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Orchestrator</div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(450.20)} (36%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">GPT-4o, Claude 3.5, etc.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Spend (30 days)</CardTitle>
            <CardDescription>Total inference and tool execution costs per day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData.byDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(val) => new Date(val).getDate().toString()} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `$${val}`} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Cost"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Agent</CardTitle>
            <CardDescription>Breakdown by autonomous worker</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData.byAgent} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(val) => `$${val}`} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="agentName" tick={{fill: 'hsl(var(--foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Cost"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="cost" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
