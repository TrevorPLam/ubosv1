import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, LayoutDashboard, GitBranch, DollarSign, Link2, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

const features = [
  {
    icon: LayoutDashboard,
    title: "Unified Marketing Dashboard",
    description: "Single view combining website traffic, SEO rankings, AI visibility, social performance, email metrics, ad spend/performance, and CRM pipeline contribution.",
  },
  {
    icon: GitBranch,
    title: "Multi-Touch Attribution",
    description: "Maps customer touchpoints across channels (ad → site → email → social → deal) to CRM contacts. Supports first-touch, last-touch, linear, time-decay, and custom weighted models.",
  },
  {
    icon: DollarSign,
    title: "Campaign ROI & ROAS",
    description: "Ties marketing spend (from Finance/AP) to attributed revenue (from CRM), calculating ROAS, CAC, and LTV:CAC ratios per campaign/channel with real-time budget vs. actual tracking.",
  },
  {
    icon: Link2,
    title: "UTM Management",
    description: "Centralized UTM builder and tracker that ensures every link is tagged with consistent naming conventions and all UTM performance flows back to campaigns and contacts.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Agent proactively surfaces anomalous performance changes, underperforming channels, overspending campaigns, audience shifts, and optimization recommendations.",
  },
];

const channelData = [
  { channel: "Organic", spend: 4200, revenue: 38400, roas: 9.1 },
  { channel: "Paid Search", spend: 18500, revenue: 74000, roas: 4.0 },
  { channel: "Social Ads", spend: 12000, revenue: 36000, roas: 3.0 },
  { channel: "Email", spend: 1800, revenue: 22500, roas: 12.5 },
  { channel: "Referral", spend: 600, revenue: 9600, roas: 16.0 },
];

const trendData = [
  { month: "Dec", revenue: 82000 },
  { month: "Jan", revenue: 91000 },
  { month: "Feb", revenue: 88000 },
  { month: "Mar", revenue: 104000 },
  { month: "Apr", revenue: 118000 },
  { month: "May", revenue: 132000 },
];

const aiInsights = [
  { type: "opportunity", text: "Email channel ROAS is 12.5x — consider increasing budget allocation by 20%." },
  { type: "warning", text: "Social Ads CAC rose 18% this week — creative fatigue detected on Meta campaigns." },
  { type: "opportunity", text: "Referral traffic up 34% — activate partner expansion program to capitalise." },
];

export function MarketingAnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Analytics</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Unified marketing performance, multi-touch attribution, and AI-powered insights.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attributed Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$132k</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+12% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ad Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$37.1k</div>
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+6% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blended ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.56x</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+0.4x MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$284</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />-$18 MoM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue Trend (6 Months)</CardTitle>
            <CardDescription>Marketing-attributed revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`$${(v / 1000).toFixed(0)}k`, "Revenue"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Channel ROAS</CardTitle>
            <CardDescription>Return on ad spend by channel</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ left: 48 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="channel" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}x`, "ROAS"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="roas" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Features</h2>
          {features.map((feature) => (
            <Card key={feature.title} className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0 mt-0.5">
                  <feature.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{feature.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Insights</CardTitle>
              <CardDescription>Agent-surfaced recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`rounded-md p-3 text-xs leading-relaxed border ${insight.type === "opportunity" ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-amber-500/20 bg-amber-500/5 text-amber-400"}`}>
                  <span className="font-semibold uppercase text-[10px] tracking-wider block mb-1">{insight.type}</span>
                  {insight.text}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">UTM Summary</CardTitle>
              <CardDescription>Active campaign tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Active UTM Links", value: "284" },
                { label: "Untagged Sessions", value: "3.2%" },
                { label: "Top Source", value: "google" },
                { label: "Top Medium", value: "cpc" },
                { label: "Top Campaign", value: "Q2-launch" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
