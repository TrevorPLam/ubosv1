import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Landmark,
  Wallet, ArrowUpRight, ArrowDownRight, Plus, RefreshCw,
  ShoppingCart, Car, Utensils, Home, Tv, Heart, Plane,
  ChevronRight, CircleDot, MoreHorizontal, Filter,
  PiggyBank, BarChart2, Receipt, Target, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Account {
  id: string;
  name: string;
  institution: string;
  type: "checking" | "savings" | "investment" | "credit" | "loan";
  balance: number;
  lastSync: string;
  change: number;
}

const accounts: Account[] = [
  { id: "1", name: "Primary Checking", institution: "Chase Bank", type: "checking", balance: 14320, lastSync: "2m ago", change: 340 },
  { id: "2", name: "High-Yield Savings", institution: "Marcus", type: "savings", balance: 42100, lastSync: "5m ago", change: 180 },
  { id: "3", name: "Brokerage", institution: "Fidelity", type: "investment", balance: 198450, lastSync: "1h ago", change: 4210 },
  { id: "4", name: "401(k)", institution: "Vanguard", type: "investment", balance: 97130, lastSync: "1h ago", change: 2100 },
  { id: "5", name: "Sapphire Reserve", institution: "Chase", type: "credit", balance: -3820, lastSync: "2m ago", change: -520 },
  { id: "6", name: "Mortgage", institution: "Wells Fargo", type: "loan", balance: -134200, lastSync: "1d ago", change: 480 },
];

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  account: string;
  icon: React.ElementType;
  pending?: boolean;
}

const transactions: Transaction[] = [
  { id: "1", merchant: "Whole Foods Market", category: "Groceries", amount: -89.42, date: "May 7", account: "Sapphire Reserve", icon: ShoppingCart },
  { id: "2", merchant: "Direct Deposit – Employer", category: "Income", amount: 4600, date: "May 6", account: "Primary Checking", icon: DollarSign },
  { id: "3", merchant: "Netflix", category: "Subscriptions", amount: -22.99, date: "May 6", account: "Sapphire Reserve", icon: Tv },
  { id: "4", merchant: "Chipotle", category: "Dining", amount: -14.75, date: "May 5", account: "Sapphire Reserve", icon: Utensils },
  { id: "5", merchant: "Shell Gas Station", category: "Transport", amount: -68.20, date: "May 5", account: "Sapphire Reserve", icon: Car },
  { id: "6", merchant: "Mortgage Payment", category: "Housing", amount: -2100, date: "May 1", account: "Primary Checking", icon: Home },
  { id: "7", merchant: "Delta Airlines", category: "Travel", amount: -324.00, date: "May 1", account: "Sapphire Reserve", icon: Plane, pending: true },
  { id: "8", merchant: "CVS Pharmacy", category: "Health", amount: -42.10, date: "Apr 30", account: "Sapphire Reserve", icon: Heart },
  { id: "9", merchant: "Amazon", category: "Shopping", amount: -157.88, date: "Apr 29", account: "Sapphire Reserve", icon: ShoppingCart },
  { id: "10", merchant: "Freelance Payment", category: "Income", amount: 1200, date: "Apr 28", account: "Primary Checking", icon: DollarSign },
];

interface BudgetCategory {
  name: string;
  icon: React.ElementType;
  budgeted: number;
  spent: number;
  color: string;
}

const budgetCategories: BudgetCategory[] = [
  { name: "Housing", icon: Home, budgeted: 2200, spent: 2100, color: "hsl(var(--chart-1))" },
  { name: "Food & Dining", icon: Utensils, budgeted: 900, spent: 820, color: "hsl(var(--chart-2))" },
  { name: "Transport", icon: Car, budgeted: 500, spent: 490, color: "hsl(var(--chart-3))" },
  { name: "Shopping", icon: ShoppingCart, budgeted: 500, spent: 640, color: "hsl(var(--chart-4))" },
  { name: "Health", icon: Heart, budgeted: 400, spent: 340, color: "hsl(var(--chart-5))" },
  { name: "Subscriptions", icon: Tv, budgeted: 250, spent: 210, color: "hsl(220 60% 60%)" },
  { name: "Travel", icon: Plane, budgeted: 300, spent: 324, color: "hsl(var(--chart-1))" },
];

const savingsGoals = [
  { name: "Emergency Fund", target: 30000, current: 24800, icon: PiggyBank, color: "hsl(var(--chart-2))" },
  { name: "Europe Trip", target: 8000, current: 3200, icon: Plane, color: "hsl(var(--chart-3))" },
  { name: "New Car", target: 25000, current: 11500, icon: Car, color: "hsl(var(--chart-4))" },
];

const ACCOUNT_TYPE_CONFIG = {
  checking: { label: "Checking", color: "bg-blue-500/10 text-blue-400" },
  savings: { label: "Savings", color: "bg-green-500/10 text-green-400" },
  investment: { label: "Investment", color: "bg-purple-500/10 text-purple-400" },
  credit: { label: "Credit Card", color: "bg-orange-500/10 text-orange-400" },
  loan: { label: "Loan", color: "bg-red-500/10 text-red-400" },
};

type TabId = "overview" | "accounts" | "transactions" | "budget" | "goals";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "budget", label: "Budget", icon: Target },
  { id: "goals", label: "Goals", icon: PiggyBank },
];

const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
const totalLiabilities = Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0));
const netWorth = totalAssets - totalLiabilities;
const currentMonth = cashFlowData[cashFlowData.length - 1];
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

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your complete financial picture, updated in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <RefreshCw className="w-3.5 h-3.5" />
            Sync All
          </Button>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 px-6 py-2 border-b shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── OVERVIEW ─────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* KPIs */}
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

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Net Worth chart */}
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

              {/* Spending donut */}
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

            {/* Cash Flow */}
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

            {/* Recent transactions preview */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                  <CardDescription>Last 5 transactions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setActiveTab("transactions")}>
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {transactions.slice(0, 5).map((tx, i) => {
                  const Icon = tx.icon;
                  const isIncome = tx.amount > 0;
                  return (
                    <div key={tx.id} className={cn("flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors", i < 4 && "border-b")}>
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
          </div>
        )}

        {/* ── ACCOUNTS ─────────────────────────────────── */}
        {activeTab === "accounts" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Assets</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(totalAssets, true)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Liabilities</p>
                    <p className="text-xl font-bold text-red-400">{formatCurrency(totalLiabilities, true)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Worth</p>
                    <p className="text-xl font-bold">{formatCurrency(netWorth, true)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden divide-y">
              <div className="grid grid-cols-[auto_1fr_120px_120px_100px_36px] gap-4 items-center px-5 py-2.5 bg-muted/30">
                <span className="w-10" />
                <span className="text-xs font-medium text-muted-foreground">Account</span>
                <span className="text-xs font-medium text-muted-foreground">Type</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Balance</span>
                <span className="text-xs font-medium text-muted-foreground">Last Sync</span>
                <span className="w-8" />
              </div>
              {accounts.map(acc => {
                const typeCfg = ACCOUNT_TYPE_CONFIG[acc.type];
                const isLiability = acc.balance < 0;
                const isPositiveChange = (acc.type === "credit" || acc.type === "loan") ? acc.change > 0 : acc.change > 0;
                return (
                  <div key={acc.id} className="grid grid-cols-[auto_1fr_120px_120px_100px_36px] gap-4 items-center px-5 py-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {acc.type === "checking" || acc.type === "savings" ? <Landmark className="w-4 h-4 text-muted-foreground" /> :
                       acc.type === "investment" ? <TrendingUp className="w-4 h-4 text-muted-foreground" /> :
                       acc.type === "credit" ? <CreditCard className="w-4 h-4 text-muted-foreground" /> :
                       <Home className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.institution}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[11px] h-5 border-0", typeCfg.color)}>{typeCfg.label}</Badge>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", isLiability ? "text-red-400" : "text-foreground")}>
                        {formatCurrency(Math.abs(acc.balance), true)}
                      </p>
                      <div className={cn("flex items-center justify-end gap-0.5 text-[11px]", isPositiveChange ? "text-green-400" : "text-red-400")}>
                        {isPositiveChange ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatCurrency(Math.abs(acc.change))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{acc.lastSync}</p>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS ─────────────────────────────── */}
        {activeTab === "transactions" && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Transactions</h2>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </div>
            <div className="border rounded-xl bg-card overflow-hidden divide-y">
              {transactions.map((tx, i) => {
                const Icon = tx.icon;
                const isIncome = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{tx.merchant}</p>
                          {tx.pending && <Badge variant="outline" className="text-[10px] h-4 border-amber-500/50 text-amber-400 px-1.5">Pending</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{tx.category} · {tx.date} · {tx.account}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={cn("text-sm font-semibold", isIncome ? "text-green-400" : "text-foreground")}>
                        {isIncome ? "+" : ""}{formatCurrency(tx.amount)}
                      </p>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BUDGET ───────────────────────────────────── */}
        {activeTab === "budget" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetCategories.reduce((s, b) => s + b.budgeted, 0))}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetCategories.reduce((s, b) => s + b.spent, 0))}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card/60">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className={cn("text-2xl font-bold", budgetCategories.reduce((s, b) => s + b.budgeted - b.spent, 0) >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatCurrency(Math.abs(budgetCategories.reduce((s, b) => s + b.budgeted - b.spent, 0)))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {budgetCategories.map(cat => {
                const Icon = cat.icon;
                const pct = Math.min((cat.spent / cat.budgeted) * 100, 100);
                const over = cat.spent > cat.budgeted;
                const remaining = cat.budgeted - cat.spent;
                return (
                  <Card key={cat.name} className="border-0 bg-card/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(cat.spent)} of {formatCurrency(cat.budgeted)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {over && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                          <div>
                            <p className={cn("text-sm font-semibold", over ? "text-red-400" : "text-green-400")}>
                              {over ? "-" : "+"}{formatCurrency(Math.abs(remaining))}
                            </p>
                            <p className="text-xs text-muted-foreground">{over ? "over budget" : "remaining"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("absolute left-0 top-0 h-full rounded-full transition-all", over ? "bg-red-400" : "bg-primary")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GOALS ────────────────────────────────────── */}
        {activeTab === "goals" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Savings Goals</h2>
              <Button size="sm" className="gap-2 h-8">
                <Plus className="w-3.5 h-3.5" />
                New Goal
              </Button>
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

            {/* Savings over time chart */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Savings Trajectory</CardTitle>
                <CardDescription>Projected vs. actual savings growth</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthData}>
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
        )}
      </div>
    </div>
  );
}
