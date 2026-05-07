import { useState } from "react";
import { useLink } from "wouter";
import {
  Building2, DollarSign, FolderKanban, CalendarDays, Search, Plus,
  Filter, MoreHorizontal, ArrowUpRight, Clock, Star, Phone, Mail,
  Globe, Briefcase, CheckCircle2, Circle, ChevronRight, X, Users,
  TrendingUp, Flame, Tag, CalendarPlus, LinkIcon, UserPlus,
  Activity, MapPin, Video, AlertCircle, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendarStore } from "@/stores/calendarStore";
import { mockProjects } from "@/api/projects";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClientStatus = "active" | "inactive" | "at-risk" | "new";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStatus;
  tier: "enterprise" | "mid-market" | "startup" | "smb";
  mrr: number;
  contractStart: string;
  contractEnd: string;
  linkedProjectIds: string[];
  tags: string[];
  notes: string;
  lastActivity: string;
  health: number;
  source: "crm" | "direct";
  crmContactId?: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CRM_CONTACTS = [
  { id: 1, name: "Sarah Chen", email: "sarah.chen@acme.com", company: "Acme Corp", score: 92, status: "hot", phone: "+1 415 555 0101" },
  { id: 2, name: "Marcus Webb", email: "m.webb@techflow.io", company: "TechFlow", score: 78, status: "warm", phone: "+1 628 555 0182" },
  { id: 3, name: "Priya Sharma", email: "priya@nexusai.com", company: "NexusAI", score: 65, status: "warm", phone: "+1 510 555 0149" },
  { id: 4, name: "Liam O'Brien", email: "liam@orbitalvc.com", company: "Orbital VC", score: 54, status: "cold", phone: "+1 212 555 0198" },
  { id: 5, name: "Yuki Tanaka", email: "y.tanaka@synth.jp", company: "Synth.jp", score: 88, status: "hot", phone: "+81 3 5555 0123" },
  { id: 6, name: "Elena Vasquez", email: "elena@cloudpeak.io", company: "CloudPeak", score: 71, status: "warm", phone: "+1 303 555 0167" },
  { id: 7, name: "Omar Hassan", email: "o.hassan@meridian.co", company: "Meridian Co", score: 43, status: "cold", phone: "+1 202 555 0114" },
  { id: 8, name: "Ava Thompson", email: "ava.t@vertexops.com", company: "VertexOps", score: 95, status: "hot", phone: "+1 415 555 0176" },
];

let mockClients: Client[] = [
  {
    id: "client-1", name: "Ava Thompson", company: "VertexOps", email: "ava.t@vertexops.com",
    phone: "+1 415 555 0176", website: "vertexops.com", status: "active", tier: "enterprise",
    mrr: 12500, contractStart: "2025-01-01", contractEnd: "2026-01-01",
    linkedProjectIds: ["proj-1", "proj-3"], tags: ["Enterprise", "Champion"],
    notes: "Key stakeholder. Expanding seats in Q3.", lastActivity: "1h ago", health: 94,
    source: "crm", crmContactId: 8,
  },
  {
    id: "client-2", name: "Yuki Tanaka", company: "Synth.jp", email: "y.tanaka@synth.jp",
    phone: "+81 3 5555 0123", website: "synth.jp", status: "active", tier: "enterprise",
    mrr: 8200, contractStart: "2024-10-01", contractEnd: "2025-10-01",
    linkedProjectIds: ["proj-2"], tags: ["Enterprise", "Renewal"],
    notes: "Renewal due in Oct. High satisfaction score.", lastActivity: "30m ago", health: 88,
    source: "crm", crmContactId: 5,
  },
  {
    id: "client-3", name: "Sarah Chen", company: "Acme Corp", email: "sarah.chen@acme.com",
    phone: "+1 415 555 0101", website: "acme.com", status: "active", tier: "mid-market",
    mrr: 4800, contractStart: "2025-03-01", contractEnd: "2026-03-01",
    linkedProjectIds: ["proj-1"], tags: ["Mid-Market", "Decision Maker"],
    notes: "Interested in advanced analytics add-on.", lastActivity: "2h ago", health: 79,
    source: "crm", crmContactId: 1,
  },
  {
    id: "client-4", name: "Elena Vasquez", company: "CloudPeak", email: "elena@cloudpeak.io",
    phone: "+1 303 555 0167", website: "cloudpeak.io", status: "at-risk", tier: "mid-market",
    mrr: 3100, contractStart: "2024-09-01", contractEnd: "2025-09-01",
    linkedProjectIds: [], tags: ["Mid-Market", "Pilot"],
    notes: "Usage dropped 40% last month. Schedule check-in.", lastActivity: "3d ago", health: 42,
    source: "crm", crmContactId: 6,
  },
  {
    id: "client-5", name: "Marcus Webb", company: "TechFlow", email: "m.webb@techflow.io",
    phone: "+1 628 555 0182", website: "techflow.io", status: "new", tier: "startup",
    mrr: 1500, contractStart: "2026-04-15", contractEnd: "2027-04-15",
    linkedProjectIds: ["proj-2"], tags: ["Startup", "Evaluating"],
    notes: "Onboarding in progress. First check-in scheduled.", lastActivity: "5h ago", health: 70,
    source: "crm", crmContactId: 2,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; dot: string }> = {
  active:   { label: "Active",   color: "text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" },
  inactive: { label: "Inactive", color: "text-slate-400 bg-slate-400/10",    dot: "bg-slate-400" },
  "at-risk":{ label: "At Risk",  color: "text-red-400 bg-red-400/10",        dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" },
  new:      { label: "New",      color: "text-blue-400 bg-blue-400/10",      dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" },
};

const TIER_CONFIG = {
  enterprise: { label: "Enterprise", color: "text-violet-400 bg-violet-400/10" },
  "mid-market": { label: "Mid-Market", color: "text-amber-400 bg-amber-400/10" },
  startup:    { label: "Startup",    color: "text-blue-400 bg-blue-400/10" },
  smb:        { label: "SMB",        color: "text-slate-400 bg-slate-400/10" },
};

const APT_TYPE_ICONS: Record<string, React.ReactNode> = {
  meeting:   <Users className="w-3 h-3" />,
  call:      <Phone className="w-3 h-3" />,
  demo:      <Video className="w-3 h-3" />,
  interview: <Briefcase className="w-3 h-3" />,
  reminder:  <AlertCircle className="w-3 h-3" />,
};

function HealthBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-emerald-400" : value >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-xs font-semibold",
        value >= 75 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400"
      )}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Convert from CRM Dialog ───────────────────────────────────────────────────

function ConvertFromCRMDialog({
  open, onClose, existingClientIds, onConvert,
}: {
  open: boolean;
  onClose: () => void;
  existingClientIds: number[];
  onConvert: (contact: typeof CRM_CONTACTS[0]) => void;
}) {
  const available = CRM_CONTACTS.filter((c) => !existingClientIds.includes(c.id));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Convert CRM Contact to Client
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Select a contact from your CRM to add as a client.
        </p>
        <ScrollArea className="max-h-80">
          <div className="flex flex-col gap-2 pr-2">
            {available.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                All CRM contacts have already been converted.
              </div>
            )}
            {available.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => { onConvert(c); onClose(); }}
              >
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.company} · {c.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full",
                    c.status === "hot" ? "text-red-400 bg-red-400/10" :
                    c.status === "warm" ? "text-amber-400 bg-amber-400/10" : "text-slate-400 bg-slate-400/10"
                  )}>
                    <Flame className="w-2.5 h-2.5 inline mr-0.5" />{c.score}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Schedule Appointment Dialog ───────────────────────────────────────────────

function ScheduleAppointmentDialog({
  open, onClose, client,
}: {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}) {
  const add = useCalendarStore((s) => s.add);
  const [form, setForm] = useState({
    title: "",
    type: "meeting" as "meeting" | "call" | "demo" | "interview" | "reminder",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "11:00",
    description: "",
    location: "",
    videoLink: "",
  });

  const COLOR_MAP: Record<string, string> = {
    meeting: "blue", call: "teal", demo: "indigo", interview: "pink", reminder: "red",
  };

  function handleSubmit() {
    if (!form.title.trim() || !form.date) return;
    add({
      title: form.title,
      type: form.type,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      allDay: false,
      description: form.description || (client ? `Appointment with ${client.name} at ${client.company}` : ""),
      attendees: client ? [client.name] : [],
      location: form.location,
      videoLink: form.videoLink,
      color: COLOR_MAP[form.type] ?? "blue",
    });
    onClose();
    setForm({ title: "", type: "meeting", date: new Date().toISOString().slice(0, 10), startTime: "10:00", endTime: "11:00", description: "", location: "", videoLink: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-primary" />
            Schedule Appointment{client ? ` — ${client.name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <Input
              placeholder="e.g. Quarterly Business Review"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date *</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <Input placeholder="Room / link" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="h-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <Textarea
              placeholder="Agenda, topics to cover…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="resize-none h-20 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!form.title.trim()}>
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />Save to Calendar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Client Detail Panel ───────────────────────────────────────────────────────

function ClientPanel({
  client, onClose, onSchedule,
}: {
  client: Client;
  onClose: () => void;
  onSchedule: () => void;
}) {
  const appointments = useCalendarStore((s) => s.appointments);
  const clientApts = appointments.filter((a) =>
    a.attendees.some((att) => att.toLowerCase().includes(client.name.toLowerCase())) ||
    a.title.toLowerCase().includes(client.company.toLowerCase())
  );
  const linkedProjects = mockProjects.filter((p) => client.linkedProjectIds.includes(p.id));
  const statusCfg = STATUS_CONFIG[client.status];
  const tierCfg = TIER_CONFIG[client.tier];

  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-80 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Client Profile</span>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-bold">
                {client.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground leading-tight">{client.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{client.company}</div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <StatusBadge status={client.status} />
                <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", tierCfg.color)}>
                  {tierCfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* Health */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Client Health</span>
              <HealthBar value={client.health} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">MRR</span>
              <span className="text-sm font-bold text-emerald-400">${client.mrr.toLocaleString()}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Contact</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" /><span>{client.phone}</span>
            </div>
            {client.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-3.5 h-3.5 shrink-0" /><span>{client.website}</span>
              </div>
            )}
          </div>

          {/* Contract */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Contract</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/30 rounded p-2">
                <div className="text-muted-foreground mb-0.5">Start</div>
                <div className="font-medium text-foreground">{client.contractStart}</div>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <div className="text-muted-foreground mb-0.5">End</div>
                <div className="font-medium text-foreground">{client.contractEnd}</div>
              </div>
            </div>
          </div>

          {/* Linked Projects */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Linked Projects ({linkedProjects.length})
            </span>
            {linkedProjects.length === 0 && (
              <p className="text-xs text-muted-foreground">No projects linked yet.</p>
            )}
            {linkedProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20 hover:border-primary/30 transition-colors cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-medium text-foreground flex-1 truncate">{p.name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
          </div>

          {/* Upcoming Appointments */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Appointments ({clientApts.length})
              </span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={onSchedule}>
                <Plus className="w-3 h-3" />Add
              </Button>
            </div>
            {clientApts.length === 0 && (
              <p className="text-xs text-muted-foreground">No appointments scheduled.</p>
            )}
            {clientApts.slice(0, 3).map((apt) => (
              <div key={apt.id} className="flex items-start gap-2 p-2 rounded-md border border-border bg-muted/20">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  {APT_TYPE_ICONS[apt.type] ?? <CalendarDays className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{apt.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {apt.date} · {apt.startTime}–{apt.endTime}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {client.tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Tags</span>
              <div className="flex flex-wrap gap-1">
                {client.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Notes</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{client.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button size="sm" className="w-full gap-2 justify-start" onClick={onSchedule}>
              <CalendarPlus className="w-3.5 h-3.5" />Schedule Appointment
            </Button>
            <Button size="sm" variant="outline" className="w-full gap-2 justify-start" asChild>
              <a href="/work">
                <FolderKanban className="w-3.5 h-3.5" />View in Work
              </a>
            </Button>
            {client.source === "crm" && (
              <Button size="sm" variant="outline" className="w-full gap-2 justify-start" asChild>
                <a href="/crm">
                  <Users className="w-3.5 h-3.5" />View CRM Contact
                </a>
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Clients Tab ───────────────────────────────────────────────────────────────

function ClientsListTab({
  clients, onSelect, onSchedule, selectedId,
}: {
  clients: Client[];
  onSelect: (c: Client) => void;
  onSchedule: (c: Client) => void;
  selectedId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tier</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">MRR</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Health</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Projects</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Last Active</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const statusCfg = STATUS_CONFIG[c.status];
                const tierCfg = TIER_CONFIG[c.tier];
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer",
                      i % 2 === 0 ? "" : "bg-muted/5",
                      selectedId === c.id && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", statusCfg.dot)} />
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", tierCfg.color)}>
                        {tierCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-400">${c.mrr.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <HealthBar value={c.health} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-semibold text-foreground">{c.linkedProjectIds.length}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{c.lastActivity}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelect(c)}>
                            <ArrowUpRight className="w-3.5 h-3.5 mr-2" />View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSchedule(c)}>
                            <CalendarPlus className="w-3.5 h-3.5 mr-2" />Schedule Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-3.5 h-3.5 mr-2" />Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="w-3.5 h-3.5 mr-2" />Log Call
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Remove Client</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground pt-2 px-1">{filtered.length} of {clients.length} clients</div>
      </ScrollArea>
    </div>
  );
}

// ── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab({ clients }: { clients: Client[] }) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4">
        {mockProjects.map((proj) => {
          const linked = clients.filter((c) => c.linkedProjectIds.includes(proj.id));
          return (
            <div key={proj.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: proj.color }} />
                  <span className="font-medium text-foreground">{proj.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{proj.status}</Badge>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href="/work"><ExternalLink className="w-3 h-3" />Open in Work</a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{proj.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Linked Clients</span>
                  {linked.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">None linked</span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {linked.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5 bg-muted/40 rounded-full px-2 py-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[c.status].dot)} />
                          <span className="text-xs font-medium text-foreground">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Tasks</div>
                  <div className="text-sm font-bold text-foreground">{proj.taskCount}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ── Appointments Tab ──────────────────────────────────────────────────────────

function AppointmentsTab({
  clients, onSchedule,
}: {
  clients: Client[];
  onSchedule: (c: Client | null) => void;
}) {
  const appointments = useCalendarStore((s) => s.appointments);
  const remove = useCalendarStore((s) => s.remove);

  const clientApts = appointments.filter((apt) =>
    clients.some((c) =>
      apt.attendees.some((att) => att.toLowerCase().includes(c.name.toLowerCase())) ||
      apt.title.toLowerCase().includes(c.company.toLowerCase())
    )
  );

  const APT_COLORS: Record<string, string> = {
    blue: "bg-blue-400/10 text-blue-300 border-blue-500/30",
    purple: "bg-purple-400/10 text-purple-300 border-purple-500/30",
    red: "bg-red-400/10 text-red-300 border-red-500/30",
    indigo: "bg-indigo-400/10 text-indigo-300 border-indigo-500/30",
    teal: "bg-teal-400/10 text-teal-300 border-teal-500/30",
    pink: "bg-pink-400/10 text-pink-300 border-pink-500/30",
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-9" onClick={() => onSchedule(null)}>
          <Plus className="w-3.5 h-3.5" />Schedule Appointment
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-9" asChild>
          <a href="/calendar"><CalendarDays className="w-3.5 h-3.5" />Open Calendar</a>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {clientApts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No client appointments yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Schedule one from a client profile or the button above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {clientApts.map((apt) => {
              const matchClient = clients.find((c) =>
                apt.attendees.some((att) => att.toLowerCase().includes(c.name.toLowerCase()))
              );
              return (
                <div key={apt.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", APT_COLORS[apt.color] ?? APT_COLORS.blue)}>
                        {APT_TYPE_ICONS[apt.type] ?? <CalendarDays className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{apt.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{apt.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.startTime}–{apt.endTime}</span>
                          {apt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {matchClient && <StatusBadge status={matchClient.status} />}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href="/calendar">Open in Calendar</a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(apt.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {apt.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {apt.attendees.map((a) => (
                        <span key={a} className="text-[10px] bg-muted/50 rounded-full px-2 py-0.5 text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Client | null | undefined>(undefined);
  const appointments = useCalendarStore((s) => s.appointments);

  const existingCrmIds = clients.filter((c) => c.crmContactId != null).map((c) => c.crmContactId!);

  const totalMrr = clients.reduce((s, c) => s + (c.status !== "inactive" ? c.mrr : 0), 0);
  const activeClients = clients.filter((c) => c.status === "active").length;
  const atRiskClients = clients.filter((c) => c.status === "at-risk").length;
  const clientApts = appointments.filter((apt) =>
    clients.some((c) =>
      apt.attendees.some((att) => att.toLowerCase().includes(c.name.toLowerCase()))
    )
  ).length;

  const statCards = [
    { label: "Total Clients", value: clients.length.toString(), sub: `${activeClients} active`, icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Monthly Revenue", value: `$${(totalMrr / 1000).toFixed(1)}K`, sub: "MRR across active", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Linked Projects", value: mockProjects.length.toString(), sub: "across all clients", icon: FolderKanban, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Appointments", value: clientApts.toString(), sub: atRiskClients > 0 ? `${atRiskClients} at-risk clients` : "all healthy", icon: CalendarDays, color: atRiskClients > 0 ? "text-amber-400" : "text-teal-400", bg: atRiskClients > 0 ? "bg-amber-400/10" : "bg-teal-400/10" },
  ];

  function handleConvert(contact: typeof CRM_CONTACTS[0]) {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      website: "",
      status: "new",
      tier: "startup",
      mrr: 0,
      contractStart: new Date().toISOString().slice(0, 10),
      contractEnd: "",
      linkedProjectIds: [],
      tags: [],
      notes: `Converted from CRM. Lead score: ${contact.score}.`,
      lastActivity: "just now",
      health: contact.score,
      source: "crm",
      crmContactId: contact.id,
    };
    setClients((prev) => [newClient, ...prev]);
    mockClients = [newClient, ...mockClients];
    setSelectedClient(newClient);
  }

  function handleSchedule(c: Client | null) {
    setScheduleTarget(c);
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Clients
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your client relationships, projects, and appointments.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowConvertDialog(true)}>
              <UserPlus className="w-3.5 h-3.5" />Convert from CRM
            </Button>
            <Button size="sm" className="gap-1.5 h-9" onClick={() => setShowConvertDialog(true)}>
              <Plus className="w-3.5 h-3.5" />Add Client
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 shrink-0">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground leading-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground truncate">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/60 truncate">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex-1 min-h-0 px-6 pb-4">
          <Tabs defaultValue="clients" className="flex flex-col h-full">
            <TabsList className="w-fit mb-4 shrink-0">
              <TabsTrigger value="clients" className="gap-1.5">
                <Building2 className="w-3.5 h-3.5" />Clients
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5">
                <FolderKanban className="w-3.5 h-3.5" />Projects
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />Appointments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ClientsListTab
                clients={clients}
                onSelect={(c) => setSelectedClient((prev) => (prev?.id === c.id ? null : c))}
                onSchedule={(c) => handleSchedule(c)}
                selectedId={selectedClient?.id ?? null}
              />
            </TabsContent>
            <TabsContent value="projects" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ProjectsTab clients={clients} />
            </TabsContent>
            <TabsContent value="appointments" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
              <AppointmentsTab clients={clients} onSchedule={handleSchedule} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Side Panel */}
      {selectedClient && (
        <ClientPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSchedule={() => handleSchedule(selectedClient)}
        />
      )}

      {/* Dialogs */}
      <ConvertFromCRMDialog
        open={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        existingClientIds={existingCrmIds}
        onConvert={handleConvert}
      />

      {scheduleTarget !== undefined && (
        <ScheduleAppointmentDialog
          open={true}
          onClose={() => setScheduleTarget(undefined)}
          client={scheduleTarget}
        />
      )}
    </div>
  );
}
