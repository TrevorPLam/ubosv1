import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Building2, TrendingDown, Scale, TrendingUp, Receipt } from "lucide-react";

interface Account {
  code: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  currency: string;
}

const accountGroups: { label: string; type: string; icon: React.ElementType; color: string; accounts: Account[] }[] = [
  {
    label: "Assets",
    type: "asset",
    icon: Building2,
    color: "text-blue-400 bg-blue-500/10",
    accounts: [
      { code: "1000", name: "Cash & Cash Equivalents", type: "asset", subtype: "Current", balance: 56420, currency: "USD" },
      { code: "1100", name: "Accounts Receivable", type: "asset", subtype: "Current", balance: 14800, currency: "USD" },
      { code: "1200", name: "Inventory", type: "asset", subtype: "Current", balance: 8200, currency: "USD" },
      { code: "1500", name: "Property & Equipment", type: "asset", subtype: "Fixed", balance: 94000, currency: "USD" },
      { code: "1600", name: "Accumulated Depreciation", type: "asset", subtype: "Fixed", balance: -12000, currency: "USD" },
    ],
  },
  {
    label: "Liabilities",
    type: "liability",
    icon: TrendingDown,
    color: "text-red-400 bg-red-500/10",
    accounts: [
      { code: "2000", name: "Accounts Payable", type: "liability", subtype: "Current", balance: 9400, currency: "USD" },
      { code: "2100", name: "Credit Card Payable", type: "liability", subtype: "Current", balance: 3820, currency: "USD" },
      { code: "2200", name: "Accrued Liabilities", type: "liability", subtype: "Current", balance: 2100, currency: "USD" },
      { code: "2500", name: "Long-Term Debt", type: "liability", subtype: "Non-Current", balance: 134200, currency: "USD" },
    ],
  },
  {
    label: "Equity",
    type: "equity",
    icon: Scale,
    color: "text-purple-400 bg-purple-500/10",
    accounts: [
      { code: "3000", name: "Owner's Equity", type: "equity", subtype: "Equity", balance: 42000, currency: "USD" },
      { code: "3100", name: "Retained Earnings", type: "equity", subtype: "Equity", balance: 175700, currency: "USD" },
      { code: "3200", name: "Current Year Earnings", type: "equity", subtype: "Equity", balance: 19700, currency: "USD" },
    ],
  },
  {
    label: "Income",
    type: "income",
    icon: TrendingUp,
    color: "text-green-400 bg-green-500/10",
    accounts: [
      { code: "4000", name: "Sales Revenue", type: "income", subtype: "Operating", balance: 84200, currency: "USD" },
      { code: "4100", name: "Service Revenue", type: "income", subtype: "Operating", balance: 31000, currency: "USD" },
      { code: "4900", name: "Other Income", type: "income", subtype: "Non-Operating", balance: 1400, currency: "USD" },
    ],
  },
  {
    label: "Expenses",
    type: "expense",
    icon: Receipt,
    color: "text-orange-400 bg-orange-500/10",
    accounts: [
      { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "COGS", balance: 38400, currency: "USD" },
      { code: "6000", name: "Salaries & Wages", type: "expense", subtype: "Operating", balance: 24000, currency: "USD" },
      { code: "6100", name: "Rent & Occupancy", type: "expense", subtype: "Operating", balance: 12600, currency: "USD" },
      { code: "6200", name: "Software & Subscriptions", type: "expense", subtype: "Operating", balance: 4200, currency: "USD" },
      { code: "6300", name: "Marketing & Advertising", type: "expense", subtype: "Operating", balance: 6800, currency: "USD" },
      { code: "6900", name: "Miscellaneous Expenses", type: "expense", subtype: "Operating", balance: 1900, currency: "USD" },
    ],
  },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

export function ChartOfAccountsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Chart of Accounts</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
            <p className="text-muted-foreground mt-1">All financial accounts organized by type to structure your bookkeeping.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            New Account
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {accountGroups.map(group => {
          const Icon = group.icon;
          const total = group.accounts.reduce((s, a) => s + Math.abs(a.balance), 0);
          return (
            <Card key={group.label} className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${group.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {group.label}
                    <Badge variant="outline" className="text-[11px] ml-1">{group.accounts.length}</Badge>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">{formatCurrency(total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden divide-y mx-6 mb-6">
                  <div className="grid grid-cols-[80px_1fr_120px_120px] gap-4 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
                    <span>Code</span>
                    <span>Name</span>
                    <span>Subtype</span>
                    <span className="text-right">Balance</span>
                  </div>
                  {group.accounts.map(acc => (
                    <div key={acc.code} className="grid grid-cols-[80px_1fr_120px_120px] gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer items-center">
                      <span className="text-xs font-mono text-muted-foreground">{acc.code}</span>
                      <span className="text-sm font-medium">{acc.name}</span>
                      <Badge variant="outline" className="text-[11px] w-fit">{acc.subtype}</Badge>
                      <span className={`text-sm font-semibold text-right ${acc.balance < 0 ? "text-red-400" : ""}`}>
                        {formatCurrency(Math.abs(acc.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
