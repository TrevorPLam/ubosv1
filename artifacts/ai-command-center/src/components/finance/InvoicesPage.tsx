/**
 * @file        artifacts/ai-command-center/src/components/finance/InvoicesPage.tsx
 * @module      AI Command Center / Finance Management
 * @purpose     Invoice management and tracking component with client billing and payment status
 *
 * @ai_instructions
 *   - Invoice data should include realistic client information and due dates.
 *   - Currency formatting must use consistent USD format with no decimals.
 *   - Status badges should use appropriate color coding for payment states.
 *   - DO NOT modify invoice status workflow without updating billing logic.
 *
 * @exports     InvoicesPage
 * @imports     wouter, @/components/ui/*, lucide-react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, MoreHorizontal, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

const invoices = [
  { id: "INV-0041", client: "Acme Corp", amount: 3200, issued: "Apr 21", due: "May 21", status: "overdue", daysOverdue: 14 },
  { id: "INV-0040", client: "Beta LLC", amount: 850, issued: "Apr 28", due: "May 28", status: "overdue", daysOverdue: 7 },
  { id: "INV-0039", client: "Gamma Inc", amount: 5400, issued: "May 1", due: "Jun 1", status: "sent", daysOverdue: 0 },
  { id: "INV-0038", client: "Delta Partners", amount: 1200, issued: "Apr 15", due: "May 15", status: "paid", daysOverdue: 0 },
  { id: "INV-0037", client: "Echo Solutions", amount: 2900, issued: "Apr 10", due: "May 10", status: "paid", daysOverdue: 0 },
  { id: "INV-0036", client: "Foxtrot Media", amount: 680, issued: "May 5", due: "Jun 5", status: "draft", daysOverdue: 0 },
  { id: "INV-0035", client: "Gulf Ventures", amount: 7800, issued: "May 6", due: "Jun 6", status: "sent", daysOverdue: 0 },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
  if (status === "overdue") return <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
  if (status === "sent") return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400"><Clock className="w-3 h-3 mr-1" />Sent</Badge>;
  return <Badge variant="outline" className="border-0 bg-muted text-muted-foreground">Draft</Badge>;
}

export function InvoicesPage() {
  const totalOutstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Invoices</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">Create, send, and track customer invoices with online payment support.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
            <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "sent" || i.status === "overdue").length} invoices</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOverdue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "overdue").length} invoices</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Paid (this period)</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "paid").length} invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden divide-y">
        <div className="grid grid-cols-[80px_1fr_100px_80px_80px_120px_36px] gap-4 items-center px-5 py-2.5 bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Invoice</span>
          <span className="text-xs font-medium text-muted-foreground">Client</span>
          <span className="text-xs font-medium text-muted-foreground text-right">Amount</span>
          <span className="text-xs font-medium text-muted-foreground">Issued</span>
          <span className="text-xs font-medium text-muted-foreground">Due</span>
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <span className="w-8" />
        </div>
        {invoices.map(inv => (
          <div key={inv.id} className="grid grid-cols-[80px_1fr_100px_80px_80px_120px_36px] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{inv.id}</span>
            </div>
            <p className="text-sm font-medium">{inv.client}</p>
            <p className={cn("text-sm font-semibold text-right", inv.status === "overdue" ? "text-red-400" : "")}>{formatCurrency(inv.amount)}</p>
            <p className="text-xs text-muted-foreground">{inv.issued}</p>
            <p className="text-xs text-muted-foreground">{inv.due}</p>
            <StatusBadge status={inv.status} />
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
