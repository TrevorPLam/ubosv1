/**
 * @file        artifacts/ai-command-center/src/components/finance/TransactionsPage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Transaction management and categorization with account reconciliation and filtering
 *
 * @ai_instructions
 *   - Transactions should use realistic merchant data and proper categorization.
 *   - Currency formatting should use USD with 2 decimal places for precision.
 *   - Category icons must accurately represent spending types.
 *   - DO NOT modify transaction categorization without updating reconciliation logic.
 *
 * @exports     TransactionsPage
 * @imports     wouter, @/components/ui/*, lucide-react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import {
  ShoppingCart, Car, Utensils, Home, Tv, Heart, Plane, DollarSign, ChevronRight, Filter, Upload, MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

const transactions = [
  { id: "1", merchant: "Whole Foods Market", category: "Groceries", amount: -89.42, date: "May 7", account: "Sapphire Reserve", icon: ShoppingCart, reconciled: true },
  { id: "2", merchant: "Direct Deposit – Employer", category: "Income", amount: 4600, date: "May 6", account: "Primary Checking", icon: DollarSign, reconciled: true },
  { id: "3", merchant: "Netflix", category: "Subscriptions", amount: -22.99, date: "May 6", account: "Sapphire Reserve", icon: Tv, reconciled: true },
  { id: "4", merchant: "Chipotle", category: "Dining", amount: -14.75, date: "May 5", account: "Sapphire Reserve", icon: Utensils, reconciled: false },
  { id: "5", merchant: "Shell Gas Station", category: "Transport", amount: -68.20, date: "May 5", account: "Sapphire Reserve", icon: Car, reconciled: false },
  { id: "6", merchant: "Mortgage Payment", category: "Housing", amount: -2100, date: "May 1", account: "Primary Checking", icon: Home, reconciled: true },
  { id: "7", merchant: "Delta Airlines", category: "Travel", amount: -324.00, date: "May 1", account: "Sapphire Reserve", icon: Plane, pending: true, reconciled: false },
  { id: "8", merchant: "CVS Pharmacy", category: "Health", amount: -42.10, date: "Apr 30", account: "Sapphire Reserve", icon: Heart, reconciled: true },
  { id: "9", merchant: "Amazon", category: "Shopping", amount: -157.88, date: "Apr 29", account: "Sapphire Reserve", icon: ShoppingCart, reconciled: true },
  { id: "10", merchant: "Freelance Payment", category: "Income", amount: 1200, date: "Apr 28", account: "Primary Checking", icon: DollarSign, reconciled: true },
];

export function TransactionsPage() {
  const totalIn = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Transactions</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">Import, categorize, and reconcile bank transactions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
            <Button size="sm" className="gap-2 h-8">
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Inflow</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIn)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Outflow</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOut)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Net</p>
            <p className={cn("text-2xl font-bold", totalIn - totalOut >= 0 ? "text-green-400" : "text-red-400")}>
              {formatCurrency(totalIn - totalOut)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden divide-y">
        <div className="grid grid-cols-[auto_1fr_120px_100px_80px_36px] gap-4 items-center px-5 py-2.5 bg-muted/30">
          <span className="w-9" />
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <span className="text-xs font-medium text-muted-foreground">Account</span>
          <span className="text-xs font-medium text-muted-foreground text-right">Amount</span>
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <span className="w-8" />
        </div>
        {transactions.map(tx => {
          const Icon = tx.icon;
          const isIncome = tx.amount > 0;
          return (
            <div key={tx.id} className="grid grid-cols-[auto_1fr_120px_100px_80px_36px] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{tx.merchant}</p>
                  {tx.pending && <Badge variant="outline" className="text-[10px] h-4 border-amber-500/50 text-amber-400 px-1.5">Pending</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{tx.account}</p>
              <p className={cn("text-sm font-semibold text-right", isIncome ? "text-green-400" : "text-foreground")}>
                {isIncome ? "+" : ""}{formatCurrency(tx.amount)}
              </p>
              <Badge variant="outline" className={cn("text-[10px] h-5 w-fit border-0", tx.reconciled ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground")}>
                {tx.reconciled ? "Reconciled" : "Unmatched"}
              </Badge>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
