import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Building2, ChevronLeft, Mail, Phone, Globe, CalendarDays,
  FolderKanban, Tag, Plus, CalendarPlus, Users, Video, Briefcase,
  AlertCircle, MapPin, Clock, MoreHorizontal, ExternalLink,
  Save, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendarStore } from "@/stores/calendarStore";
import { mockProjects } from "@/api/projects";
import { mockClients, STATUS_CONFIG, TIER_CONFIG, Client, ClientStatus } from "./clientsData";

// ── Helpers ───────────────────────────────────────────────────────────────────

function HealthBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-emerald-400" : value >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-sm font-bold shrink-0",
        value >= 75 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400"
      )}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const APT_TYPE_ICONS: Record<string, React.ReactNode> = {
  meeting:   <Users className="w-3.5 h-3.5" />,
  call:      <Phone className="w-3.5 h-3.5" />,
  demo:      <Video className="w-3.5 h-3.5" />,
  interview: <Briefcase className="w-3.5 h-3.5" />,
  reminder:  <AlertCircle className="w-3.5 h-3.5" />,
};

// ── Schedule Appointment Dialog ───────────────────────────────────────────────

function ScheduleAppointmentDialog({
  open, onClose, client,
}: {
  open: boolean;
  onClose: () => void;
  client: Client;
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
      description: form.description || `Appointment with ${client.name} at ${client.company}`,
      attendees: [client.name],
      location: form.location,
      videoLink: "",
      color: COLOR_MAP[form.type] ?? "blue",
    });
    onClose();
    setForm({ title: "", type: "meeting", date: new Date().toISOString().slice(0, 10), startTime: "10:00", endTime: "11:00", description: "", location: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-primary" />
            Schedule Appointment — {client.name}
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

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const appointments = useCalendarStore((s) => s.appointments);
  const removeApt = useCalendarStore((s) => s.remove);

  const [client, setClient] = useState<Client | null>(() =>
    mockClients.find((c) => c.id === params.id) ?? null
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Client | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [newTag, setNewTag] = useState("");

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Building2 className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Client not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/clients")}>
          <ChevronLeft className="w-4 h-4 mr-1" />Back to Clients
        </Button>
      </div>
    );
  }

  const linkedProjects = mockProjects.filter((p) => client.linkedProjectIds.includes(p.id));
  const clientApts = appointments.filter((a) =>
    a.attendees.some((att) => att.toLowerCase().includes(client.name.toLowerCase())) ||
    a.title.toLowerCase().includes(client.company.toLowerCase())
  );
  const statusCfg = STATUS_CONFIG[client.status];
  const tierCfg = TIER_CONFIG[client.tier];

  function startEdit() {
    setDraft({ ...client });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditing(false);
  }

  function saveEdit() {
    if (!draft) return;
    const idx = mockClients.findIndex((c) => c.id === draft.id);
    if (idx !== -1) mockClients[idx] = draft;
    setClient(draft);
    setDraft(null);
    setEditing(false);
  }

  function addTag() {
    if (!newTag.trim() || !draft) return;
    if (draft.tags.includes(newTag.trim())) { setNewTag(""); return; }
    setDraft((d) => d ? { ...d, tags: [...d.tags, newTag.trim()] } : d);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setDraft((d) => d ? { ...d, tags: d.tags.filter((t) => t !== tag) } : d);
  }

  const d = editing && draft ? draft : client;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 -ml-1" onClick={() => navigate("/clients")}>
          <ChevronLeft className="w-4 h-4" />Clients
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-foreground">{client.name}</span>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={cancelEdit}>
                <X className="w-3.5 h-3.5" />Cancel
              </Button>
              <Button size="sm" className="gap-1.5 h-8" onClick={saveEdit}>
                <Save className="w-3.5 h-3.5" />Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowSchedule(true)}>
                <CalendarPlus className="w-3.5 h-3.5" />Schedule
              </Button>
              <Button size="sm" className="gap-1.5 h-8" onClick={startEdit}>
                Edit Client
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-5 flex flex-col gap-5 max-w-5xl mx-auto">

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                  {client.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                      <Input value={draft!.name} onChange={(e) => setDraft((d) => d ? { ...d, name: e.target.value } : d)} className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
                      <Input value={draft!.company} onChange={(e) => setDraft((d) => d ? { ...d, company: e.target.value } : d)} className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                      <Select value={draft!.status} onValueChange={(v) => setDraft((d) => d ? { ...d, status: v as ClientStatus } : d)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="at-risk">At Risk</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Tier</label>
                      <Select value={draft!.tier} onValueChange={(v) => setDraft((d) => d ? { ...d, tier: v as Client["tier"] } : d)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="mid-market">Mid-Market</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="smb">SMB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
                      <StatusBadge status={client.status} />
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tierCfg.color)}>
                        {tierCfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{client.company}</div>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Monthly Revenue</div>
                        <div className="text-xl font-bold text-emerald-400">${client.mrr.toLocaleString()}</div>
                      </div>
                      <div className="flex-1 max-w-48">
                        <div className="text-xs text-muted-foreground mb-1">Client Health</div>
                        <HealthBar value={client.health} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {editing && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">MRR ($)</label>
                  <Input
                    type="number"
                    value={draft!.mrr}
                    onChange={(e) => setDraft((d) => d ? { ...d, mrr: Number(e.target.value) } : d)}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Health (0–100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={draft!.health}
                    onChange={(e) => setDraft((d) => d ? { ...d, health: Math.min(100, Math.max(0, Number(e.target.value))) } : d)}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Contact Info */}
            <Section title="Contact Information">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                    <Input value={draft!.email} onChange={(e) => setDraft((d) => d ? { ...d, email: e.target.value } : d)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                    <Input value={draft!.phone} onChange={(e) => setDraft((d) => d ? { ...d, phone: e.target.value } : d)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
                    <Input value={draft!.website} onChange={(e) => setDraft((d) => d ? { ...d, website: e.target.value } : d)} className="h-9" placeholder="example.com" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <a href={`mailto:${client.email}`} className="text-sm text-foreground hover:text-primary transition-colors">{client.email}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="text-sm text-foreground">{client.phone}</div>
                    </div>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Website</div>
                        <a href={`https://${client.website}`} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:text-primary transition-colors">{client.website}</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Contract */}
            <Section title="Contract Details">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Contract Start</label>
                    <Input type="date" value={draft!.contractStart} onChange={(e) => setDraft((d) => d ? { ...d, contractStart: e.target.value } : d)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Contract End</label>
                    <Input type="date" value={draft!.contractEnd} onChange={(e) => setDraft((d) => d ? { ...d, contractEnd: e.target.value } : d)} className="h-9" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" />Start Date
                    </div>
                    <div className="text-sm font-semibold text-foreground">{client.contractStart || "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" />End Date
                    </div>
                    <div className="text-sm font-semibold text-foreground">{client.contractEnd || "—"}</div>
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Notes */}
          <Section title="Notes">
            {editing ? (
              <Textarea
                value={draft!.notes}
                onChange={(e) => setDraft((d) => d ? { ...d, notes: e.target.value } : d)}
                className="resize-none h-28 text-sm"
                placeholder="Add notes about this client…"
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {client.notes || <span className="italic">No notes yet.</span>}
              </p>
            )}
          </Section>

          {/* Tags */}
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {d.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs px-2.5 py-1 gap-1.5">
                  <Tag className="w-3 h-3" />{t}
                  {editing && (
                    <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {d.tags.length === 0 && !editing && (
                <span className="text-sm text-muted-foreground italic">No tags assigned.</span>
              )}
              {editing && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag…"
                    className="h-7 text-xs w-28"
                  />
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={addTag}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </Section>

          {/* Linked Projects */}
          <Section
            title={`Linked Projects (${linkedProjects.length})`}
            action={
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                <a href="/work"><ExternalLink className="w-3 h-3" />Open Work</a>
              </Button>
            }
          >
            {linkedProjects.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <FolderKanban className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No projects linked to this client yet.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {linkedProjects.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 hover:border-primary/30 transition-colors">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.status}</Badge>
                      <span className="text-xs text-muted-foreground">{p.taskCount} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Appointments */}
          <Section
            title={`Appointments (${clientApts.length})`}
            action={
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSchedule(true)}>
                <Plus className="w-3 h-3" />Schedule
              </Button>
            }
          >
            {clientApts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No appointments scheduled for this client.</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowSchedule(true)}>
                    <CalendarPlus className="w-3.5 h-3.5" />Schedule Appointment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {clientApts.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/10 group hover:border-primary/30 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {APT_TYPE_ICONS[apt.type] ?? <CalendarDays className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{apt.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{apt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.startTime}–{apt.endTime}</span>
                        {apt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href="/calendar">Open in Calendar</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => removeApt(apt.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>
      </ScrollArea>

      <ScheduleAppointmentDialog
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        client={client}
      />
    </div>
  );
}
