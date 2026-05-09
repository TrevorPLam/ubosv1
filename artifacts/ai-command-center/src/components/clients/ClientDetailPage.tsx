/**
 * @file        artifacts/ai-command-center/src/components/clients/ClientDetailPage.tsx
 * @module      AI Command Center / Clients
 * @purpose     Detailed client management page with projects, agreements, documents, and communication
 *
 * @ai_instructions
 *   - Client detail page must support comprehensive client information management
 *   - Must integrate with calendar store for appointment scheduling
 *   - Should provide tabs for projects, agreements, and documents
 *   - DO NOT modify client data structure without updating clients API types
 *
 * @exports     ClientDetailPage
 * @imports     react, wouter, lucide-react, @/lib/utils, @/components/ui/*, @/stores/calendarStore, @/api/*, ./clientsData
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Building2, ChevronLeft, Mail, Phone, Globe, CalendarDays,
  FolderKanban, Tag, Plus, CalendarPlus, Users, Video, Briefcase,
  AlertCircle, MapPin, Clock, MoreHorizontal, ExternalLink,
  Save, X, Linkedin, Twitter, Facebook, Instagram, Link2,
  FileText, FileSignature, User, CheckCircle2, Send, Eye,
  PenLine, XCircle, Trash2, Download, Share2, File, FileSpreadsheet,
  FileImage, FileCode, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendarStore } from "@/stores/calendarStore";
import { mockProjects } from "@/api/projects";
import { mockAgreements } from "@/api/agreements";
import { mockClientDocuments } from "@/api/clientDocuments";
import {
  mockClients, STATUS_CONFIG, LANGUAGES, COUNTRIES,
  Client, ClientStatus, EmailEntry, PhoneEntry, WebsiteEntry, SocialEntry,
  Address, Salutation, Gender, EmailType, PhoneType, SocialPlatform,
  clientDisplayName,
} from "./clientsData";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  "LinkedIn": Linkedin,
  "Twitter/X": Twitter,
  "Facebook": Facebook,
  "Instagram": Instagram,
  "Other": Link2,
};

function SocialIcon({ platform }: { platform: string }) {
  const Icon = PLATFORM_ICONS[platform] ?? Link2;
  return <Icon className="w-3.5 h-3.5" />;
}

const AGR_STATUS_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  signed:  { label: "Signed",  icon: CheckCircle2, cls: "text-green-500 border-green-500/30 bg-green-500/10" },
  viewed:  { label: "Viewed",  icon: Eye,          cls: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
  sent:    { label: "Sent",    icon: Send,         cls: "text-violet-500 border-violet-500/30 bg-violet-500/10" },
  draft:   { label: "Draft",   icon: PenLine,      cls: "text-muted-foreground border-muted" },
  expired: { label: "Expired", icon: XCircle,      cls: "text-red-500 border-red-500/30 bg-red-500/10" },
};

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: File, spreadsheet: FileSpreadsheet, doc: FileText, image: FileImage, code: FileCode,
};
const DOC_TYPE_COLORS: Record<string, string> = {
  pdf: "text-red-400", spreadsheet: "text-green-400", doc: "text-blue-400",
  image: "text-purple-400", code: "text-amber-400",
};
const DOC_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  approved:           { label: "Approved",       cls: "text-green-500 bg-green-500/10" },
  pending:            { label: "Pending Review",  cls: "text-amber-500 bg-amber-500/10" },
  draft:              { label: "Draft",           cls: "text-muted-foreground bg-muted" },
  requires_signature: { label: "Needs Signature", cls: "text-orange-500 bg-orange-500/10" },
  expired:            { label: "Expired",         cls: "text-red-500 bg-red-500/10" },
  signed:             { label: "Signed",          cls: "text-green-500 bg-green-500/10" },
  sent:               { label: "Sent",            cls: "text-violet-500 bg-violet-500/10" },
};

const APT_TYPE_ICONS: Record<string, React.ElementType> = {
  meeting: Users, call: Phone, demo: Video, interview: Briefcase, reminder: AlertCircle,
};

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function AddressDisplay({ addr, label }: { addr: Address; label: string }) {
  const isEmpty = !addr.street && !addr.city && !addr.country;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {isEmpty ? (
        <span className="text-sm text-muted-foreground italic">Not set</span>
      ) : (
        <div className="text-sm text-foreground leading-relaxed">
          {addr.street && <div>{addr.street}</div>}
          {(addr.city || addr.state || addr.postalCode) && (
            <div>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</div>
          )}
          {addr.country && <div>{addr.country}</div>}
        </div>
      )}
    </div>
  );
}

function AddressEdit({
  label, value, onChange,
}: { label: string; value: Address; onChange: (a: Address) => void }) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Street</label>
        <Input value={value.street} onChange={set("street")} className="h-9 text-sm" placeholder="123 Main St" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">City</label>
          <Input value={value.city} onChange={set("city")} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">State / Province</label>
          <Input value={value.state} onChange={set("state")} className="h-9 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Postal Code</label>
          <Input value={value.postalCode} onChange={set("postalCode")} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Country</label>
          <Select value={value.country || "__none__"} onValueChange={(v) => onChange({ ...value, country: v === "__none__" ? "" : v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Not set —</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Dialog ───────────────────────────────────────────────────────────

function ScheduleDialog({ open, onClose, client }: { open: boolean; onClose: () => void; client: Client }) {
  const add = useCalendarStore((s) => s.add);
  const [form, setForm] = useState({
    title: "", type: "meeting" as "meeting" | "call" | "demo" | "interview" | "reminder",
    date: new Date().toISOString().slice(0, 10), startTime: "10:00", endTime: "11:00",
    description: "", location: "",
  });
  const COLOR_MAP: Record<string, string> = { meeting: "blue", call: "teal", demo: "indigo", interview: "pink", reminder: "red" };
  function submit() {
    if (!form.title.trim()) return;
    add({ ...form, allDay: false, attendees: [clientDisplayName(client)], videoLink: "", color: COLOR_MAP[form.type] ?? "blue" });
    onClose();
    setForm({ title: "", type: "meeting", date: new Date().toISOString().slice(0, 10), startTime: "10:00", endTime: "11:00", description: "", location: "" });
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-primary" />Schedule — {clientDisplayName(client)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <Input placeholder="e.g. Quarterly Business Review" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
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
            <Textarea placeholder="Agenda…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="resize-none h-20 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!form.title.trim()}>
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />Save to Calendar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Multi-value field editors ─────────────────────────────────────────────────

function EmailsEditor({ value, onChange }: { value: EmailEntry[]; onChange: (v: EmailEntry[]) => void }) {
  function add() {
    onChange([...value, { id: `e${Date.now()}`, type: "Work", email: "", primary: false }]);
  }
  function remove(id: string) { onChange(value.filter((e) => e.id !== id)); }
  function update(id: string, patch: Partial<EmailEntry>) {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function setPrimary(id: string) {
    onChange(value.map((e) => ({ ...e, primary: e.id === id })));
  }
  return (
    <div className="flex flex-col gap-2">
      {value.map((e) => (
        <div key={e.id} className="flex items-center gap-2">
          <Select value={e.type} onValueChange={(v) => update(e.id, { type: v as EmailType })}>
            <SelectTrigger className="h-8 w-28 text-xs shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Work", "Personal", "Other"] as EmailType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={e.email} onChange={(ev) => update(e.id, { email: ev.target.value })} className="h-8 text-sm flex-1" placeholder="email@example.com" />
          <button onClick={() => setPrimary(e.id)} title="Set primary" className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0 transition-colors", e.primary ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:border-primary/30")}>
            {e.primary ? "Primary" : "Set primary"}
          </button>
          <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-fit" onClick={add}>
        <Plus className="w-3 h-3" />Add Email
      </Button>
    </div>
  );
}

function PhonesEditor({ value, onChange }: { value: PhoneEntry[]; onChange: (v: PhoneEntry[]) => void }) {
  function add() { onChange([...value, { id: `p${Date.now()}`, type: "Mobile", number: "", primary: false }]); }
  function remove(id: string) { onChange(value.filter((p) => p.id !== id)); }
  function update(id: string, patch: Partial<PhoneEntry>) { onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p))); }
  function setPrimary(id: string) { onChange(value.map((p) => ({ ...p, primary: p.id === id }))); }
  return (
    <div className="flex flex-col gap-2">
      {value.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <Select value={p.type} onValueChange={(v) => update(p.id, { type: v as PhoneType })}>
            <SelectTrigger className="h-8 w-24 text-xs shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Mobile", "Work", "Home", "Fax", "Other"] as PhoneType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={p.number} onChange={(ev) => update(p.id, { number: ev.target.value })} className="h-8 text-sm flex-1" placeholder="+1 555 000 0000" />
          <button onClick={() => setPrimary(p.id)} title="Set primary" className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0 transition-colors", p.primary ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:border-primary/30")}>
            {p.primary ? "Primary" : "Set primary"}
          </button>
          <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-fit" onClick={add}>
        <Plus className="w-3 h-3" />Add Phone
      </Button>
    </div>
  );
}

function WebsitesEditor({ value, onChange }: { value: WebsiteEntry[]; onChange: (v: WebsiteEntry[]) => void }) {
  function add() { onChange([...value, { id: `w${Date.now()}`, url: "", label: "" }]); }
  function remove(id: string) { onChange(value.filter((w) => w.id !== id)); }
  function update(id: string, patch: Partial<WebsiteEntry>) { onChange(value.map((w) => (w.id === id ? { ...w, ...patch } : w))); }
  return (
    <div className="flex flex-col gap-2">
      {value.map((w) => (
        <div key={w.id} className="flex items-center gap-2">
          <Input value={w.label} onChange={(ev) => update(w.id, { label: ev.target.value })} className="h-8 text-sm w-24 shrink-0" placeholder="Label" />
          <Input value={w.url} onChange={(ev) => update(w.id, { url: ev.target.value })} className="h-8 text-sm flex-1" placeholder="example.com" />
          <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-fit" onClick={add}>
        <Plus className="w-3 h-3" />Add Website
      </Button>
    </div>
  );
}

function SocialsEditor({ value, onChange }: { value: SocialEntry[]; onChange: (v: SocialEntry[]) => void }) {
  function add() { onChange([...value, { id: `s${Date.now()}`, platform: "LinkedIn", url: "" }]); }
  function remove(id: string) { onChange(value.filter((s) => s.id !== id)); }
  function update(id: string, patch: Partial<SocialEntry>) { onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s))); }
  const platforms: SocialPlatform[] = ["LinkedIn", "Twitter/X", "Facebook", "Instagram", "Other"];
  return (
    <div className="flex flex-col gap-2">
      {value.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <Select value={s.platform} onValueChange={(v) => update(s.id, { platform: v as SocialPlatform })}>
            <SelectTrigger className="h-8 w-32 text-xs shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={s.url} onChange={(ev) => update(s.id, { url: ev.target.value })} className="h-8 text-sm flex-1" placeholder="Profile URL" />
          <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-fit" onClick={add}>
        <Plus className="w-3 h-3" />Add Social Profile
      </Button>
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

  const d = editing && draft ? draft : client;
  const displayName = clientDisplayName(d);
  const initials = [(d.firstName ?? "")[0], (d.lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || (d.firstName ?? "").slice(0, 2).toUpperCase() || "?";

  const linkedProjects = mockProjects.filter((p) => client.linkedProjectIds.includes(p.id));
  const linkedDocs = mockClientDocuments.filter((doc) => doc.clientId === client.id);
  const linkedAgreements = mockAgreements.filter((a) => client.linkedAgreementIds.includes(a.id));
  const clientApts = appointments.filter((a) =>
    a.attendees.some((att) => att.toLowerCase().includes(client.firstName.toLowerCase())) ||
    a.attendees.some((att) => att.toLowerCase().includes(client.lastName.toLowerCase())) ||
    (client.company && a.title.toLowerCase().includes(client.company.toLowerCase()))
  );

  function startEdit() { setDraft({ ...client }); setEditing(true); }
  function cancelEdit() { setDraft(null); setEditing(false); }
  function saveEdit() {
    if (!draft) return;
    const idx = mockClients.findIndex((c) => c.id === draft.id);
    if (idx !== -1) mockClients[idx] = draft;
    setClient(draft);
    setDraft(null);
    setEditing(false);
  }
  function setD(patch: Partial<Client>) { setDraft((prev) => prev ? { ...prev, ...patch } : prev); }

  function addTag() {
    if (!newTag.trim() || !draft) return;
    if (!draft.tags.includes(newTag.trim())) setD({ tags: [...draft.tags, newTag.trim()] });
    setNewTag("");
  }
  function removeTag(t: string) { setD({ tags: draft!.tags.filter((x) => x !== t) }); }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" className="gap-1 h-8 -ml-1 text-muted-foreground hover:text-foreground" onClick={() => navigate("/clients")}>
          <ChevronLeft className="w-4 h-4" />Clients
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
        <StatusBadge status={client.status} />
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
              <Button size="sm" className="gap-1.5 h-8" onClick={startEdit}>Edit Client</Button>
            </>
          )}
        </div>
      </div>

      {/* Profile banner */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/50 shrink-0">
        <Avatar className="w-14 h-14 shrink-0">
          <AvatarFallback className="text-base bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-foreground leading-tight truncate">{displayName || "—"}</div>
          <div className="text-sm text-muted-foreground">
            {[d.jobTitle, d.company].filter(Boolean).join(" · ") || "No company set"}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {d.emails.find((e) => e.primary)?.email && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.emails.find((e) => e.primary)!.email}</span>
            )}
            {d.phones.find((p) => p.primary)?.number && (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phones.find((p) => p.primary)!.number}</span>
            )}
            {d.lastActivity && (
              <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />Active {d.lastActivity}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="details" className="h-full flex flex-col">
          <div className="px-6 pt-3 pb-0 border-b border-border shrink-0">
            <TabsList className="h-8">
              <TabsTrigger value="details" className="text-xs px-3 gap-1.5">
                <User className="w-3.5 h-3.5" />Details
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-xs px-3 gap-1.5">
                <FolderKanban className="w-3.5 h-3.5" />Projects ({linkedProjects.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs px-3 gap-1.5">
                <FileText className="w-3.5 h-3.5" />Documents ({linkedDocs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="flex-1 min-h-0 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5 flex flex-col gap-5 max-w-4xl">

                {/* Identity */}
                <Section title="Identity & Name">
                  {editing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Salutation</label>
                        <Select value={draft!.salutation || "__none__"} onValueChange={(v) => setD({ salutation: (v === "__none__" ? "" : v) as Salutation })}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {(["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."] as Salutation[]).filter(Boolean).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Preferred Name</label>
                        <Input maxLength={40} value={draft!.preferredName} onChange={(e) => setD({ preferredName: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">First Name *</label>
                        <Input maxLength={40} value={draft!.firstName} onChange={(e) => setD({ firstName: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Middle Name</label>
                        <Input maxLength={40} value={draft!.middleName} onChange={(e) => setD({ middleName: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Last Name *</label>
                        <Input maxLength={40} value={draft!.lastName} onChange={(e) => setD({ lastName: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Suffix</label>
                        <Input maxLength={10} value={draft!.suffix} onChange={(e) => setD({ suffix: e.target.value })} className="h-9 text-sm" placeholder="Jr., Sr., III…" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Date of Birth</label>
                        <Input type="date" value={draft!.dateOfBirth} onChange={(e) => setD({ dateOfBirth: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                        <Select value={draft!.gender || "__none__"} onValueChange={(v) => setD({ gender: (v === "__none__" ? "" : v) as Gender })}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {(["Male", "Female", "Non-binary", "Prefer not to say"] as Gender[]).filter(Boolean).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Preferred Language</label>
                        <Select value={draft!.preferredLanguage || "__none__"} onValueChange={(v) => setD({ preferredLanguage: v === "__none__" ? "" : v })}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                        <Select value={draft!.status} onValueChange={(v) => setD({ status: v as ClientStatus })}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="at-risk">At Risk</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Company</label>
                        <Input maxLength={50} value={draft!.company} onChange={(e) => setD({ company: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
                        <Input maxLength={50} value={draft!.jobTitle} onChange={(e) => setD({ jobTitle: e.target.value })} className="h-9 text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                      <Field label="Salutation">{d.salutation || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="First Name">{d.firstName || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Middle Name">{d.middleName || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Last Name">{d.lastName || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Suffix">{d.suffix || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Preferred Name">{d.preferredName || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Date of Birth">{d.dateOfBirth || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Gender">{d.gender || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Preferred Language">{d.preferredLanguage || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Company">{d.company || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Job Title">{d.jobTitle || <span className="text-muted-foreground">—</span>}</Field>
                      <Field label="Status"><StatusBadge status={d.status} /></Field>
                    </div>
                  )}
                </Section>

                {/* Contact Information */}
                <Section title="Contact Information">
                  {editing ? (
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Email Addresses</p>
                        <EmailsEditor value={draft!.emails} onChange={(v) => setD({ emails: v })} />
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold text-foreground mb-2">Phone Numbers</p>
                        <PhonesEditor value={draft!.phones} onChange={(v) => setD({ phones: v })} />
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold text-foreground mb-2">Website URLs</p>
                        <WebsitesEditor value={draft!.websites} onChange={(v) => setD({ websites: v })} />
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold text-foreground mb-2">Social Profiles</p>
                        <SocialsEditor value={draft!.socialProfiles} onChange={(v) => setD({ socialProfiles: v })} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Emails */}
                      {d.emails.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2">Email Addresses</p>
                          <div className="flex flex-col gap-1.5">
                            {d.emails.map((e) => (
                              <div key={e.id} className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{e.type}</span>
                                <a href={`mailto:${e.email}`} className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{e.email}
                                </a>
                                {e.primary && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Primary</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Phones */}
                      {d.phones.length > 0 && (
                        <div className={cn(d.emails.length > 0 && "border-t border-border pt-4")}>
                          <p className="text-xs font-semibold text-foreground mb-2">Phone Numbers</p>
                          <div className="flex flex-col gap-1.5">
                            {d.phones.map((p) => (
                              <div key={p.id} className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{p.type}</span>
                                <span className="text-sm text-foreground flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{p.number}
                                </span>
                                {p.primary && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Primary</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Websites */}
                      {d.websites.length > 0 && (
                        <div className="border-t border-border pt-4">
                          <p className="text-xs font-semibold text-foreground mb-2">Website URLs</p>
                          <div className="flex flex-col gap-1.5">
                            {d.websites.map((w) => (
                              <div key={w.id} className="flex items-center gap-3">
                                {w.label && <span className="text-[10px] text-muted-foreground w-16 shrink-0">{w.label}</span>}
                                <a href={`https://${w.url}`} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{w.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Social */}
                      {d.socialProfiles.length > 0 && (
                        <div className="border-t border-border pt-4">
                          <p className="text-xs font-semibold text-foreground mb-2">Social Profiles</p>
                          <div className="flex flex-wrap gap-2">
                            {d.socialProfiles.map((s) => (
                              <a key={s.id} href={`https://${s.url}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/40 rounded-full px-3 py-1.5 transition-colors">
                                <SocialIcon platform={s.platform} />{s.platform}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {d.emails.length === 0 && d.phones.length === 0 && d.websites.length === 0 && d.socialProfiles.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No contact information added yet.</p>
                      )}
                    </div>
                  )}
                </Section>

                {/* Addresses */}
                <Section title="Addresses">
                  {editing ? (
                    <div className="flex flex-col gap-6">
                      <AddressEdit label="Physical Address" value={draft!.physicalAddress} onChange={(a) => setD({ physicalAddress: a })} />
                      <div className="border-t border-border pt-5">
                        <AddressEdit label="Mailing Address" value={draft!.mailingAddress} onChange={(a) => setD({ mailingAddress: a })} />
                      </div>
                      <div className="border-t border-border pt-5">
                        <AddressEdit label="Business Address" value={draft!.businessAddress} onChange={(a) => setD({ businessAddress: a })} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-6">
                      <AddressDisplay addr={d.physicalAddress} label="Physical" />
                      <AddressDisplay addr={d.mailingAddress} label="Mailing" />
                      <AddressDisplay addr={d.businessAddress} label="Business" />
                    </div>
                  )}
                </Section>

                {/* Record Management */}
                <Section title="Record Management">
                  {editing ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Client Owner</label>
                        <Input maxLength={80} value={draft!.clientOwner} onChange={(e) => setD({ clientOwner: e.target.value })} className="h-9 text-sm" placeholder="Team member name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                        <Textarea value={draft!.notes} onChange={(e) => setD({ notes: e.target.value })} className="resize-none h-28 text-sm" placeholder="Add general notes…" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {draft!.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                              {t}
                              <button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Add tag…" className="h-8 text-xs w-36" />
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={addTag}><Plus className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Field label="Client Owner">
                        {d.clientOwner ? (
                          <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />{d.clientOwner}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </Field>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">Notes</span>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {d.notes || <span className="text-muted-foreground italic">No notes yet.</span>}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-2">Tags</span>
                        {d.tags.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">No tags.</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {d.tags.map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs px-2.5 py-0.5 gap-1">
                                <Tag className="w-3 h-3" />{t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Section>

                {/* Agreements */}
                <Section
                  title={`Agreements (${linkedAgreements.length})`}
                  action={
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1" asChild>
                      <a href="/crm/agreements"><ExternalLink className="w-3 h-3" />View All</a>
                    </Button>
                  }
                >
                  {linkedAgreements.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-center">
                      <div>
                        <FileSignature className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No agreements linked to this client.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {linkedAgreements.map((a) => {
                        const m = AGR_STATUS_MAP[a.status] ?? AGR_STATUS_MAP.draft;
                        const Icon = m.icon;
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 hover:border-primary/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground">{a.title}</div>
                              <div className="text-xs text-muted-foreground font-mono">{a.id} · {a.value}</div>
                            </div>
                            <Badge variant="outline" className={cn("shrink-0 text-xs", m.cls)}>
                              <Icon className="w-3 h-3 mr-1" />{m.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground shrink-0">{a.sent}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>

                {/* Appointments */}
                <Section
                  title={`Appointments (${clientApts.length})`}
                  action={
                    <Button size="sm" className="h-6 text-xs gap-1" onClick={() => setShowSchedule(true)}>
                      <Plus className="w-3 h-3" />Schedule
                    </Button>
                  }
                >
                  {clientApts.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-center">
                      <div>
                        <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
                        <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowSchedule(true)}>
                          <CalendarPlus className="w-3.5 h-3.5" />Schedule Appointment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {clientApts.map((apt) => {
                        const Icon = APT_TYPE_ICONS[apt.type] ?? CalendarDays;
                        return (
                          <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/10 group hover:border-primary/30 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Icon className="w-3.5 h-3.5" />
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
                                <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 shrink-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><a href="/calendar">Open in Calendar</a></DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => removeApt(apt.id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>

              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── PROJECTS TAB ── */}
          <TabsContent value="projects" className="flex-1 min-h-0 overflow-hidden m-0">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
              <p className="text-sm text-muted-foreground">{linkedProjects.length} project{linkedProjects.length !== 1 ? "s" : ""} linked to this client</p>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
                <a href="/work"><ExternalLink className="w-3.5 h-3.5" />Open Work</a>
              </Button>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="px-6 py-5 flex flex-col gap-3 max-w-4xl">
                {linkedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FolderKanban className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No projects linked yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Projects linked in the Work page will appear here.</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-1.5" asChild>
                      <a href="/work"><ExternalLink className="w-3.5 h-3.5" />Go to Work</a>
                    </Button>
                  </div>
                ) : (
                  mockProjects.map((p) => {
                    const linked = linkedProjects.find((lp) => lp.id === p.id);
                    if (!linked) return null;
                    return (
                      <div key={p.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                            <span className="font-medium text-foreground">{p.name}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.status}</Badge>
                          </div>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                            <a href="/work"><ExternalLink className="w-3 h-3" />Open</a>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{p.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{p.taskCount} tasks</span>
                          <span>Created {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── DOCUMENTS TAB ── */}
          <TabsContent value="documents" className="flex-1 min-h-0 overflow-hidden m-0">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
              <p className="text-sm text-muted-foreground">{linkedDocs.length} document{linkedDocs.length !== 1 ? "s" : ""} for this client</p>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
                <a href="/documents"><ExternalLink className="w-3.5 h-3.5" />Open Documents</a>
              </Button>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="px-6 py-5 max-w-4xl">
                {linkedDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Documents linked to this client from the Documents page will appear here.</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-1.5" asChild>
                      <a href="/documents"><ExternalLink className="w-3.5 h-3.5" />Go to Documents</a>
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-xl bg-card overflow-hidden divide-y">
                    <div className="grid grid-cols-[auto_1fr_130px_90px_90px_36px] gap-4 items-center px-4 py-2 bg-muted/30">
                      <span className="w-5" />
                      <span className="text-xs font-medium text-muted-foreground">Name</span>
                      <span className="text-xs font-medium text-muted-foreground">Status</span>
                      <span className="text-xs font-medium text-muted-foreground">Modified</span>
                      <span className="text-xs font-medium text-muted-foreground">Size</span>
                      <span className="w-8" />
                    </div>
                    {linkedDocs.map((doc) => {
                      const Icon = DOC_TYPE_ICONS[doc.type] ?? File;
                      const colorCls = DOC_TYPE_COLORS[doc.type] ?? "text-muted-foreground";
                      const statusCfg = DOC_STATUS_MAP[doc.status] ?? DOC_STATUS_MAP.draft;
                      return (
                        <div key={doc.id} className="grid grid-cols-[auto_1fr_130px_90px_90px_36px] gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors group cursor-pointer">
                          <Icon className={cn("w-5 h-5 shrink-0", colorCls)} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {doc.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                              <span className="text-sm font-medium truncate">{doc.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{doc.version}</div>
                          </div>
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full w-fit", statusCfg.cls)}>{statusCfg.label}</span>
                          <span className="text-xs text-muted-foreground">{doc.modified}</span>
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="gap-2 text-sm"><Eye className="w-4 h-4" />View</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Download className="w-4 h-4" />Download</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Share2 className="w-4 h-4" />Share</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleDialog open={showSchedule} onClose={() => setShowSchedule(false)} client={client} />
    </div>
  );
}
