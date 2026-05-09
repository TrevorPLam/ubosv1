/**
 * @file        artifacts/ai-command-center/src/components/finance/ReportsPage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Financial reports generation with profit/loss analysis and trend visualization
 *
 * @ai_instructions
 *   - Reports should use consistent chart types and color schemes.
 *   - Currency formatting must support both full and compact display modes.
 *   - Trend indicators should accurately reflect period-over-period changes.
 *   - DO NOT modify report calculations without updating financial analysis logic.
 *
 * @exports     ReportsPage
 * @imports     wouter, recharts, @/components/ui/*, lucide-react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number, compact = false) => {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(val);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
};

const plData = [
  { month: "Nov", revenue: 18400, expenses: 13600, profit: 4800 },
  { month: "Dec", revenue: 22800, expenses: 17800, profit: 5000 },
  { month: "Jan", revenue: 18400, expenses: 12800, profit: 5600 },
  { month: "Feb", revenue: 18400, expenses: 14200, profit: 4200 },
  { month: "Mar", revenue: 19400, expenses: 13200, profit: 6200 },
  { month: "Apr", revenue: 18400, expenses: 14800, profit: 3600 },
  { month: "May", revenue: 18400, expenses: 11800, profit: 6600 },
];

const plSummary = [
  { label: "Revenue", value: 134200, change: 8.2, positive: true },
  { label: "Cost of Goods Sold", value: 38400, change: 3.1, positive: false },
  { label: "Gross Profit", value: 95800, change: 10.4, positive: true },
  { label: "Operating Expenses", value: 57000, change: -2.1, positive: true },
  { label: "Operating Income", value: 38800, change: 18.6, positive: true },
  { label: "Tax Provision", value: 9700, change: 12.1, positive: false },
  { label: "Net Income", value: 29100, change: 21.3, positive: true },
];

const balanceSummary = [
  { section: "Assets", items: [
    { label: "Current Assets", value: 79420 },
    { label: "Fixed Assets (net)", value: 82000 },
  ]},
  { section: "Liabilities", items: [
    { label: "Current Liabilities", value: 15320 },
    { label: "Long-Term Debt", value: 134200 },
  ]},
  { section: "Equity", items: [
    { label: "Owner's Equity", value: 42000 },
    { label: "Retained Earnings + Current", value: 195400 },
  ]},
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

export function ReportsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Reports</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">Standard financial reports over any date range.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profit & Loss</CardTitle>
          <CardDescription>Nov 2025 – May 2026 · Revenue vs. expenses</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income Statement Summary</CardTitle>
            <CardDescription>YTD vs. prior year</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {plSummary.map((row, i) => (
                <div key={row.label} className={cn("flex items-center justify-between px-6 py-3", i === plSummary.length - 1 && "bg-muted/20 font-semibold")}>
                  <p className="text-sm">{row.label}</p>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center gap-0.5 text-xs", row.positive ? "text-green-400" : "text-red-400")}>
                      {row.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(row.change)}%
                    </div>
                    <p className="text-sm font-semibold w-24 text-right">{formatCurrency(row.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Balance Sheet Summary</CardTitle>
            <CardDescription>As of May 7, 2026</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {balanceSummary.map(group => (
                <div key={group.section}>
                  <div className="px-6 py-2 bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.section}</p>
                  </div>
                  {group.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between px-6 py-3">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold">{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Profit & Loss", desc: "Income statement by period" },
          { label: "Balance Sheet", desc: "Assets, liabilities, equity" },
          { label: "Cash Flow", desc: "Operating, investing, financing" },
          { label: "Tax Summary", desc: "Taxable income & deductions" },
        ].map(r => (
          <Card key={r.label} className="border-0 bg-card/60 hover:bg-accent/40 transition-colors cursor-pointer group">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-1">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-3 h-3" /> Export PDF
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
