import { Link } from "wouter";
import { Home, Utensils, Car, ShoppingCart, Heart, Tv, Plane, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

const budgetCategories = [
  { name: "Housing", icon: Home, budgeted: 2200, spent: 2100, color: "hsl(var(--chart-1))" },
  { name: "Food & Dining", icon: Utensils, budgeted: 900, spent: 820, color: "hsl(var(--chart-2))" },
  { name: "Transport", icon: Car, budgeted: 500, spent: 490, color: "hsl(var(--chart-3))" },
  { name: "Shopping", icon: ShoppingCart, budgeted: 500, spent: 640, color: "hsl(var(--chart-4))" },
  { name: "Health", icon: Heart, budgeted: 400, spent: 340, color: "hsl(var(--chart-5))" },
  { name: "Subscriptions", icon: Tv, budgeted: 250, spent: 210, color: "hsl(220 60% 60%)" },
  { name: "Travel", icon: Plane, budgeted: 300, spent: 324, color: "hsl(var(--chart-1))" },
];

export function BudgetPage() {
  const totalBudgeted = budgetCategories.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgetCategories.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/finance" className="hover:text-foreground transition-colors">Finance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Budget</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
            <p className="text-muted-foreground mt-1">Set spending targets by category and track variance against actual performance.</p>
          </div>
          <Button size="sm" className="gap-2 h-8">
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={cn("text-2xl font-bold", remaining >= 0 ? "text-green-400" : "text-red-400")}>
              {formatCurrency(Math.abs(remaining))}
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
  );
}
