/**
 * @file        artifacts/ai-command-center/src/components/finance/GoalsPage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Financial goals tracking with progress visualization and savings milestones
 *
 * @ai_instructions
 *   - Goals should use consistent color coding with chart variables for visualization.
 *   - Currency formatting must support both full and compact display modes.
 *   - Progress calculations should accurately reflect current vs target amounts.
 *   - DO NOT modify goal tracking logic without updating progress calculations.
 *
 * @exports     GoalsPage
 * @imports     wouter, recharts, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { PiggyBank, Plane, Car, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const formatCurrency = (val: number, compact = false) => {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(val);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
};

const savingsGoals = [
  { name: "Emergency Fund", target: 30000, current: 24800, icon: PiggyBank, color: "hsl(var(--chart-2))" },
  { name: "Europe Trip", target: 8000, current: 3200, icon: Plane, color: "hsl(var(--chart-3))" },
  { name: "New Car", target: 25000, current: 11500, icon: Car, color: "hsl(var(--chart-4))" },
];

const trajectoryData = [
  { month: "Nov", net: 167000 },
  { month: "Dec", net: 175000 },
  { month: "Jan", net: 181000 },
  { month: "Feb", net: 189500 },
  { month: "Mar", net: 203000 },
  { month: "Apr", net: 201000 },
  { month: "May", net: 217800 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function GoalsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Goals</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground mt-1">Define savings targets and monitor funded progress toward each goal.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {savingsGoals.map(goal => {
          const Icon = goal.icon;
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <Card key={goal.name} className="border-0 bg-card/60 hover:border hover:border-primary/40 transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: goal.color + "20" }}>
                    <Icon className="w-5 h-5" style={{ color: goal.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">Target: {formatCurrency(goal.target, true)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold">{formatCurrency(goal.current, true)}</p>
                    <p className="text-sm font-medium" style={{ color: goal.color }}>{pct}%</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(goal.target - goal.current)} to go
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Savings Trajectory</CardTitle>
          <CardDescription>Projected vs. actual savings growth</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData}>
              <defs>
                <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="net" name="Net Worth" stroke="hsl(var(--chart-2))" fill="url(#savGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
