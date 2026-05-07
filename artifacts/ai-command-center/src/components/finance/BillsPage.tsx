import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, MoreHorizontal, Receipt, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

const bills = [
  { id: "BILL-112", vendor: "AWS", amount: 1240, due: "May 12", category: "Software", status: "overdue", approver: "Auto" },
  { id: "BILL-111", vendor: "Office Landlord LLC", amount: 4200, due: "Jun 1", category: "Rent", status: "pending-approval", approver: "Finance Team" },
  { id: "BILL-110", vendor: "Staples Business", amount: 380, due: "May 20", category: "Supplies", status: "scheduled", approver: "Auto" },
  { id: "BILL-109", vendor: "Google Workspace", amount: 144, due: "May 15", category: "Software", status: "scheduled", approver: "Auto" },
  { id: "BILL-108", vendor: "Acme Supplier Co.", amount: 6700, due: "May 10", category: "Inventory", status: "paid", approver: "Jane D." },
  { id: "BILL-107", vendor: "Delta Logistics", amount: 890, due: "Apr 30", category: "Shipping", status: "paid", approver: "Auto" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
  if (status === "overdue") return <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
  if (status === "scheduled") return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
  return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400"><Clock className="w-3 h-3 mr-1" />Awaiting Approval</Badge>;
}

export function BillsPage() {
  const totalOutstanding = bills.filter(b => b.status !== "paid").reduce((s, b) => s + b.amount, 0);
  const totalOverdue = bills.filter(b => b.status === "overdue").reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Bills</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-muted-foreground mt-1">Record vendor bills, schedule payments, and route bills for approval.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
            <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bills.filter(b => b.status !== "paid").length} bills</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOverdue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bills.filter(b => b.status === "overdue").length} bills</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Paid (this period)</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bills.filter(b => b.status === "paid").length} bills</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden divide-y">
        <div className="grid grid-cols-[80px_1fr_100px_80px_100px_140px_36px] gap-4 items-center px-5 py-2.5 bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Bill</span>
          <span className="text-xs font-medium text-muted-foreground">Vendor</span>
          <span className="text-xs font-medium text-muted-foreground text-right">Amount</span>
          <span className="text-xs font-medium text-muted-foreground">Due</span>
          <span className="text-xs font-medium text-muted-foreground">Category</span>
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <span className="w-8" />
        </div>
        {bills.map(bill => (
          <div key={bill.id} className="grid grid-cols-[80px_1fr_100px_80px_100px_140px_36px] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{bill.id.split("-")[1]}</span>
            </div>
            <p className="text-sm font-medium">{bill.vendor}</p>
            <p className={cn("text-sm font-semibold text-right", bill.status === "overdue" ? "text-red-400" : "")}>{formatCurrency(bill.amount)}</p>
            <p className="text-xs text-muted-foreground">{bill.due}</p>
            <Badge variant="outline" className="text-[11px] border-0 bg-muted text-muted-foreground w-fit">{bill.category}</Badge>
            <StatusBadge status={bill.status} />
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
