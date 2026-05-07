import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, Plus, Send, MessageSquare, Zap, Users,
  CheckCircle2, Clock, Play, Pause, MoreHorizontal, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const broadcasts = [
  { id: 1, name: "Flash Sale — 24hr", status: "sent", sent: 2140, delivered: 2118, replies: 48, optOuts: 3, sentDate: "May 6, 2026" },
  { id: 2, name: "Webinar Reminder", status: "sent", sent: 980, delivered: 971, replies: 12, optOuts: 1, sentDate: "May 4, 2026" },
  { id: 3, name: "Product Update Alert", status: "scheduled", sent: 0, delivered: 0, replies: 0, optOuts: 0, sentDate: "May 10, 2026" },
  { id: 4, name: "Q1 Re-engagement Blast", status: "sent", sent: 1650, delivered: 1628, replies: 34, optOuts: 7, sentDate: "Apr 20, 2026" },
];

const automatedSMS = [
  { id: 1, name: "Welcome SMS", trigger: "Contact subscribes", sent: 2150, active: true, goal: "First engagement" },
  { id: 2, name: "Demo Reminder", trigger: "Meeting in 1 hour", sent: 312, active: true, goal: "Attendance" },
  { id: 3, name: "Proposal Nudge", trigger: "Proposal unopened 3d", sent: 87, active: true, goal: "Open rate" },
  { id: 4, name: "Payment Reminder", trigger: "Invoice 7d overdue", sent: 44, active: false, goal: "Payment received" },
];

const inbox = [
  { contact: "Sarah Chen", company: "Acme Corp", message: "Sounds great, I'll loop in the team tomorrow.", time: "10m ago", unread: true },
  { contact: "Yuki Tanaka", company: "Synth.jp", message: "Can you send me the updated pricing?", time: "1h ago", unread: true },
  { contact: "Marcus Webb", company: "TechFlow", message: "Got it, thanks.", time: "3h ago", unread: false },
  { contact: "Elena Vasquez", company: "CloudPeak", message: "Let's connect Thursday at 2pm.", time: "1d ago", unread: false },
];

const features = [
  { icon: Send, title: "Broadcast SMS", description: "One-time campaigns to lists or segments with delivery and opt-out reporting." },
  { icon: Zap, title: "Automated SMS", description: "Trigger SMS via automation actions — welcome messages, reminders, follow-ups." },
  { icon: MessageSquare, title: "Two-Way Inbox", description: "Receive and reply to SMS messages in a unified inbox alongside your contact record." },
  { icon: ShieldCheck, title: "A2P 10DLC Compliance", description: "Registered phone numbers compliant with carrier requirements. No deliverability issues." },
];

export function SMSPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">SMS</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">SMS</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Broadcast
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Sent This Month", value: "4,770", sub: "2 broadcasts", icon: Send, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Avg Delivery Rate", value: "98.8%", sub: "A2P registered", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Two-Way Replies", value: "94", sub: "This month", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Automations", value: "3", sub: "Active triggers", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground leading-tight">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-4">
        <Tabs defaultValue="broadcasts" className="flex flex-col h-full">
          <TabsList className="w-fit shrink-0 mb-4">
            <TabsTrigger value="broadcasts" className="gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" /> Broadcasts
            </TabsTrigger>
            <TabsTrigger value="automated" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" /> Automated
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Inbox
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broadcasts" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                {broadcasts.map((b) => (
                  <div key={b.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-foreground">{b.name}</span>
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1", b.status === "sent" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10")}>
                            {b.status === "sent" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{b.sentDate}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Report</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {b.status === "sent" && (
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: "Sent", value: b.sent.toLocaleString() },
                          { label: "Delivered", value: b.delivered.toLocaleString() },
                          { label: "Replies", value: b.replies },
                          { label: "Opt-outs", value: b.optOuts },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="text-[10px] text-muted-foreground mb-0.5">{m.label}</div>
                            <div className="text-sm font-semibold">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="automated" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                {automatedSMS.map((a) => (
                  <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", a.active ? "bg-emerald-400/10" : "bg-muted")}>
                          <Zap className={cn("w-4 h-4", a.active ? "text-emerald-400" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", a.active ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-muted")}>
                              {a.active ? "Active" : "Paused"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">Trigger: <span className="text-foreground/70 font-medium">{a.trigger}</span></div>
                          <div className="text-xs text-muted-foreground mt-0.5">{a.sent.toLocaleString()} sent · Goal: {a.goal}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inbox" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-2">
                {inbox.map((msg, i) => (
                  <div key={i} className={cn("bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors flex items-start gap-3", msg.unread && "border-primary/30 bg-primary/5")}>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                      {msg.contact.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{msg.contact}</span>
                          <span className="text-[10px] text-muted-foreground">· {msg.company}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                          {msg.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
