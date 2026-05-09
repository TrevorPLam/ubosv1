/**
 * @file        artifacts/ai-command-center/src/components/finance/JournalEntriesPage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Double-entry bookkeeping journal entries management with debit/credit tracking
 *
 * @ai_instructions
 *   - Journal entries must maintain balanced debits and credits for each transaction.
 *   - Currency formatting should use USD with 2 decimal places for accounting precision.
 *   - Entry status should support both draft and posted states.
 *   - DO NOT modify journal entry structure without updating accounting logic.
 *
 * @exports     JournalEntriesPage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, MoreHorizontal, BookOpen } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  status: "posted" | "draft";
  lines: { account: string; debit: number; credit: number }[];
}

const entries: JournalEntry[] = [
  {
    id: "JE-0024",
    date: "May 7",
    description: "Depreciation – May 2026",
    reference: "Auto-generated",
    status: "posted",
    lines: [
      { account: "6500 – Depreciation Expense", debit: 833, credit: 0 },
      { account: "1600 – Accumulated Depreciation", debit: 0, credit: 833 },
    ],
  },
  {
    id: "JE-0023",
    date: "May 1",
    description: "Prepaid Insurance Amortization",
    reference: "Manual",
    status: "posted",
    lines: [
      { account: "6400 – Insurance Expense", debit: 290, credit: 0 },
      { account: "1300 – Prepaid Insurance", debit: 0, credit: 290 },
    ],
  },
  {
    id: "JE-0022",
    date: "Apr 30",
    description: "Accrued Payroll – April",
    reference: "Manual",
    status: "posted",
    lines: [
      { account: "6000 – Salaries & Wages", debit: 12000, credit: 0 },
      { account: "2200 – Accrued Liabilities", debit: 0, credit: 12000 },
    ],
  },
  {
    id: "JE-0021",
    date: "Apr 28",
    description: "Bad Debt Write-off – Foxtrot Co.",
    reference: "Manual",
    status: "posted",
    lines: [
      { account: "6800 – Bad Debt Expense", debit: 1400, credit: 0 },
      { account: "1100 – Accounts Receivable", debit: 0, credit: 1400 },
    ],
  },
  {
    id: "JE-0025",
    date: "May 8",
    description: "Opening balance adjustment",
    reference: "Draft",
    status: "draft",
    lines: [
      { account: "1000 – Cash", debit: 500, credit: 0 },
      { account: "3100 – Retained Earnings", debit: 0, credit: 500 },
    ],
  },
];

export function JournalEntriesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Journal Entries</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
            <p className="text-muted-foreground mt-1">Manual double-entry adjustments and specialized transactions.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Posted this month</p>
            <p className="text-2xl font-bold">{entries.filter(e => e.status === "posted").length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Drafts</p>
            <p className="text-2xl font-bold text-amber-400">{entries.filter(e => e.status === "draft").length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total debits moved</p>
            <p className="text-2xl font-bold">{formatCurrency(entries.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.debit, 0), 0))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="border rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <Badge variant="outline" className={
                      entry.status === "posted"
                        ? "border-green-500/30 bg-green-500/10 text-green-400 text-[10px] h-4 px-1.5"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] h-4 px-1.5"
                    }>
                      {entry.status === "posted" ? "Posted" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.id} · {entry.date} · {entry.reference}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="divide-y">
              {entry.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-2.5 text-sm">
                  <span className="text-muted-foreground text-xs font-mono">{line.account}</span>
                  <span className="text-right text-xs font-semibold">{line.debit > 0 ? formatCurrency(line.debit) : "—"}</span>
                  <span className="text-right text-xs font-semibold">{line.credit > 0 ? formatCurrency(line.credit) : "—"}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-2 bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Totals</span>
                <span className="text-right text-xs font-bold">{formatCurrency(entry.lines.reduce((s, l) => s + l.debit, 0))}</span>
                <span className="text-right text-xs font-bold">{formatCurrency(entry.lines.reduce((s, l) => s + l.credit, 0))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
