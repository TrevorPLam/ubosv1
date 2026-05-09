/**
 * @file        artifacts/ai-command-center/src/components/finance/FinancePage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Main finance dashboard hub with navigation to all financial sub-modules
 *
 * @ai_instructions
 *   - Navigation cards should maintain consistent layout and hover states.
 *   - Icons must accurately represent their respective financial functions.
 *   - Descriptions should be concise yet informative for each sub-module.
 *   - DO NOT modify navigation structure without updating routing configuration.
 *
 * @exports     FinancePage
 * @imports     wouter, @/components/ui/*, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, List, ArrowLeftRight, FileText, Receipt, BookOpen, BarChart2, Target, PiggyBank, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/finance/overview",
    icon: LayoutDashboard,
    label: "Overview",
    description: "Cash balances, profit and loss summary, upcoming bills, and overdue invoices at a glance.",
  },
  {
    href: "/finance/chart-of-accounts",
    icon: List,
    label: "Chart of Accounts",
    description: "Financial accounts organized into assets, liabilities, equity, income, and expenses.",
  },
  {
    href: "/finance/transactions",
    icon: ArrowLeftRight,
    label: "Transactions",
    description: "Import bank transactions, categorize them into accounts, and reconcile against statements.",
  },
  {
    href: "/finance/invoices",
    icon: FileText,
    label: "Invoices",
    description: "Create, send, and track customer invoices. Accept payments and follow up on overdue amounts.",
  },
  {
    href: "/finance/bills",
    icon: Receipt,
    label: "Bills",
    description: "Record vendor bills, schedule payments, route for approval, and track outstanding amounts.",
  },
  {
    href: "/finance/journal-entries",
    icon: BookOpen,
    label: "Journal Entries",
    description: "Manual adjustments and double-entry transactions not captured automatically elsewhere.",
  },
  {
    href: "/finance/reports",
    icon: BarChart2,
    label: "Reports",
    description: "Profit and loss, balance sheet, cash flow statement, and tax summary over any date range.",
  },
  {
    href: "/finance/budget",
    icon: Target,
    label: "Budget",
    description: "Set income and expense targets by category and compare actual performance against the plan.",
  },
  {
    href: "/finance/goals",
    icon: PiggyBank,
    label: "Goals",
    description: "Define savings targets or cash reserve goals and monitor progress through funded amount.",
  },
];

export function FinancePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground mt-1">Manage accounting, invoicing, reporting, and financial planning in one place.</p>
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
