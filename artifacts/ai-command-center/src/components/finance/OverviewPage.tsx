import { Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, PiggyBank, ChevronRight,
  ShoppingCart, Car, Utensils, Home, Tv, Heart, Plane, DollarSign,
  AlertTriangle, Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number, compact = false) => {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(val);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
};

const netWorthData = [
  { month: "Nov", assets: 312000, liabilities: 145000, net: 167000 },
  { month: "Dec", assets: 318000, liabilities: 143000, net: 175000 },
  { month: "Jan", assets: 322000, liabilities: 141000, net: 181000 },
  { month: "Feb", assets: 329000, liabilities: 139500, net: 189500 },
  { month: "Mar", assets: 341000, liabilities: 138000, net: 203000 },
  { month: "Apr", assets: 337000, liabilities: 136000, net: 201000 },
  { month: "May", assets: 352000, liabilities: 134200, net: 217800 },
];

const cashFlowData = [
  { month: "Nov", income: 9200, expenses: 6800 },
  { month: "Dec", income: 11400, expenses: 8900 },
  { month: "Jan", income: 9200, expenses: 6400 },
  { month: "Feb", income: 9200, expenses: 7100 },
  { month: "Mar", income: 9700, expenses: 6600 },
  { month: "Apr", income: 9200, expenses: 7400 },
  { month: "May", income: 9200, expenses: 5900 },
];

const spendingData = [
  { name: "Housing", value: 2100, color: "hsl(var(--chart-1))" },
  { name: "Food & Dining", value: 820, color: "hsl(var(--chart-2))" },
  { name: "Transport", value: 490, color: "hsl(var(--chart-3))" },
  { name: "Subscriptions", value: 210, color: "hsl(var(--chart-4))" },
  { name: "Health", value: 340, color: "hsl(var(--chart-5))" },
  { name: "Shopping", value: 640, color: "hsl(220 60% 60%)" },
  { name: "Other", value: 300, color: "hsl(var(--muted-foreground))" },
];

const recentTransactions = [
  { id: "1", merchant: "Whole Foods Market", category: "Groceries", amount: -89.42, date: "May 7", account: "Sapphire Reserve", icon: ShoppingCart },
  { id: "2", merchant: "Direct Deposit – Employer", category: "Income", amount: 4600, date: "May 6", account: "Primary Checking", icon: DollarSign },
  { id: "3", merchant: "Netflix", category: "Subscriptions", amount: -22.99, date: "May 6", account: "Sapphire Reserve", icon: Tv },
  { id: "4", merchant: "Chipotle", category: "Dining", amount: -14.75, date: "May 5", account: "Sapphire Reserve", icon: Utensils },
  { id: "5", merchant: "Shell Gas Station", category: "Transport", amount: -68.20, date: "May 5", account: "Sapphire Reserve", icon: Car },
];

const upcomingBills = [
  { name: "Rent", due: "Jun 1", amount: 2100, status: "upcoming" },
  { name: "Internet", due: "May 15", amount: 79, status: "upcoming" },
  { name: "Car Insurance", due: "May 12", amount: 148, status: "overdue" },
];

const overdueInvoices = [
  { client: "Acme Corp", amount: 3200, daysOverdue: 14 },
  { client: "Beta LLC", amount: 850, daysOverdue: 7 },
];

const currentMonth = cashFlowData[cashFlowData.length - 1];
const netWorth = netWorthData[netWorthData.length - 1].net;
const savingsRate = Math.round(((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
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

export function OverviewPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Overview</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your complete financial picture, updated in real time.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/60 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(netWorth, true)}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +{formatCurrency(netWorth - netWorthData[netWorthData.length - 2].net, true)} this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth.income)}</p>
            <p className="text-xs text-muted-foreground mt-1">May 2026</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Monthly Expenses</p>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth.expenses)}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
              <ArrowDownRight className="w-3 h-3" />
              {formatCurrency(cashFlowData[cashFlowData.length - 2].expenses - currentMonth.expenses)} vs last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{savingsRate}%</p>
            <Progress value={savingsRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net Worth</CardTitle>
            <CardDescription>Assets vs. liabilities over 7 months</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="assets" name="Assets" stroke="hsl(var(--chart-2))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke="hsl(var(--chart-4))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Area type="monotone" dataKey="net" name="Net Worth" stroke="hsl(var(--primary))" fill="url(#netGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <CardDescription>May 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={spendingData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2} dataKey="value">
                    {spendingData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {spendingData.slice(0, 4).map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cash Flow</CardTitle>
          <CardDescription>Income vs. spending, last 7 months</CardDescription>
        </CardHeader>
        <CardContent className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-card/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </div>
            <Link href="/finance/transactions">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.map((tx, i) => {
              const Icon = tx.icon;
              const isIncome = tx.amount > 0;
              return (
                <div key={tx.id} className={cn("flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors", i < recentTransactions.length - 1 && "border-b")}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.merchant}</p>
                      <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", isIncome ? "text-green-400" : "text-foreground")}>
                      {isIncome ? "+" : ""}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.account}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 bg-card/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Upcoming Bills</CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </div>
              <Link href="/finance/bills">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingBills.map((bill, i) => (
                <div key={bill.name} className={cn("flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors", i < upcomingBills.length - 1 && "border-b")}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">Due {bill.due}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bill.status === "overdue" && <Badge variant="outline" className="text-[10px] h-4 border-red-500/50 text-red-400 px-1.5">Overdue</Badge>}
                    <p className="text-sm font-semibold">{formatCurrency(bill.amount)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Overdue Invoices</CardTitle>
                <CardDescription>{formatCurrency(overdueInvoices.reduce((s, i) => s + i.amount, 0))} outstanding</CardDescription>
              </div>
              <Link href="/finance/invoices">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {overdueInvoices.map((inv, i) => (
                <div key={inv.client} className={cn("flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors", i < overdueInvoices.length - 1 && "border-b")}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.client}</p>
                      <p className="text-xs text-muted-foreground">{inv.daysOverdue} days overdue</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-red-400">{formatCurrency(inv.amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
