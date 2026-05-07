import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CalendarDays, Inbox, BarChart2, Radio, Bot, TrendingUp, Heart, MessageCircle, Share } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Content Calendar & Publisher",
    description: "Visual calendar for planning and scheduling posts across Meta, X, LinkedIn, TikTok, etc.; includes drag-and-drop scheduling, platform previews, and AI-suggested optimal posting times.",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    description: "All comments, DMs, and mentions from connected platforms in one feed. AI agent triages by sentiment/urgency, suggests response drafts, and routes critical items to the attention queue.",
  },
  {
    icon: BarChart2,
    title: "Analytics & Attribution",
    description: "Post-level metrics (reach, impressions, engagement, clicks, shares) plus UTM-based mapping to CRM deals and revenue, delivering consistent cross-platform reporting.",
  },
  {
    icon: Radio,
    title: "Social Listening",
    description: "Tracks brand mentions, keyword monitoring, competitor activity, and sentiment trends across social platforms and the broader web.",
  },
  {
    icon: Bot,
    title: "AI Content Assistant",
    description: "Generates post drafts, suggests hashtags, recommends content based on trending topics, and repurposes long-form content into social snippets — bounded by brand voice guidelines.",
  },
];

const platforms = [
  { name: "LinkedIn", followers: "24.1k", engagement: "4.2%", posts: 18, change: "+8%" },
  { name: "X (Twitter)", followers: "18.7k", engagement: "2.9%", posts: 34, change: "+3%" },
  { name: "Meta", followers: "41.3k", engagement: "3.7%", posts: 22, change: "+12%" },
  { name: "TikTok", followers: "9.2k", engagement: "7.8%", posts: 11, change: "+41%" },
];

const inboxItems = [
  { platform: "LinkedIn", user: "@sarah.m", message: "Loved the latest article on AI agents!", sentiment: "positive", time: "2m ago" },
  { platform: "X", user: "@devtools_fan", message: "Is there an API for the command center?", sentiment: "neutral", time: "14m ago" },
  { platform: "Meta", user: "@john.b", message: "Pricing seems high for small teams.", sentiment: "negative", time: "32m ago" },
  { platform: "LinkedIn", user: "@tech_investor", message: "Impressive product roadmap!", sentiment: "positive", time: "1h ago" },
];

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, string> = {
    positive: "text-green-500 border-green-500/30 bg-green-500/10",
    neutral: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    negative: "text-red-500 border-red-500/30 bg-red-500/10",
  };
  return <Badge variant="outline" className={`text-[10px] capitalize ${map[sentiment]}`}>{sentiment}</Badge>;
}

export function SocialsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Socials</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Socials</h1>
        <p className="text-muted-foreground mt-1">Schedule, publish, listen, and engage across all social platforms in one hub.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93.3k</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+16% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.65%</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+0.8% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inbox Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">27</div>
            <p className="text-xs text-muted-foreground mt-1">3 need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform Performance</CardTitle>
              <CardDescription>Followers, engagement rate, and posts this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <div className="grid grid-cols-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                  <span className="col-span-2">Platform</span>
                  <span className="text-center">Followers</span>
                  <span className="text-center">Engagement</span>
                  <span className="text-right">Growth</span>
                </div>
                {platforms.map((p) => (
                  <div key={p.name} className="grid grid-cols-5 items-center py-2.5 border-b border-border/50 last:border-0">
                    <span className="col-span-2 text-xs font-medium">{p.name}</span>
                    <span className="text-xs text-center">{p.followers}</span>
                    <span className="text-xs text-center">{p.engagement}</span>
                    <span className="text-xs text-right text-green-500 font-medium">{p.change}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unified Inbox</CardTitle>
              <CardDescription>Recent mentions & messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inboxItems.map((item, i) => (
                <div key={i} className="space-y-1.5 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{item.user}</span>
                    <div className="flex items-center gap-1.5">
                      <SentimentBadge sentiment={item.sentiment} />
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">"{item.message}"</p>
                  <span className="text-[10px] text-muted-foreground/60">{item.platform}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listening Summary</CardTitle>
              <CardDescription>Last 7 days across the web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Brand Mentions", value: "1,204" },
                { label: "Positive Sentiment", value: "78%" },
                { label: "Negative Sentiment", value: "8%" },
                { label: "Competitor Mentions", value: "892" },
                { label: "New Reach", value: "248k" },
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
