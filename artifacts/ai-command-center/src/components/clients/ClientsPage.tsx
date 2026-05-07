import { useState } from "react";
import { useLocation } from "wouter";
import {
  Building2, DollarSign, FolderKanban, CalendarDays, Search,
  Plus, MoreHorizontal, ArrowUpRight, Clock, Phone, Mail,
  UserPlus, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendarStore } from "@/stores/calendarStore";
import { mockProjects } from "@/api/projects";
import { mockClients, STATUS_CONFIG, TIER_CONFIG, Client, ClientStatus } from "./clientsData";

export type { ClientStatus, Client };

// ── CRM Contact data ──────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [, navigate] = useLocation();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
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

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
    mockClients.unshift(newClient);
    navigate(`/clients/${newClient.id}`);
  }

  function handleRemove(clientId: string) {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    const idx = mockClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) mockClients.splice(idx, 1);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
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

      {/* Search & Filter */}
      <div className="flex items-center gap-2 px-6 pb-3 shrink-0">
        <div className="relative flex-1 min-w-40 max-w-sm">
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

      {/* Client List */}
      <div className="flex-1 min-h-0 px-6 pb-4">
        <ScrollArea className="h-full">
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
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer",
                        i % 2 === 0 ? "" : "bg-muted/5",
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
                            <DropdownMenuItem onClick={() => navigate(`/clients/${c.id}`)}>
                              <ArrowUpRight className="w-3.5 h-3.5 mr-2" />View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-3.5 h-3.5 mr-2" />Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="w-3.5 h-3.5 mr-2" />Log Call
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemove(c.id)}
                            >
                              Remove Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No clients match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground pt-2 px-1">{filtered.length} of {clients.length} clients</div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <ConvertFromCRMDialog
        open={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        existingClientIds={existingCrmIds}
        onConvert={handleConvert}
      />
    </div>
  );
}
