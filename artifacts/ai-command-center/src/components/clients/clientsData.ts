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

export let mockClients: Client[] = [
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

export const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; dot: string }> = {
  active:   { label: "Active",   color: "text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" },
  inactive: { label: "Inactive", color: "text-slate-400 bg-slate-400/10",    dot: "bg-slate-400" },
  "at-risk":{ label: "At Risk",  color: "text-red-400 bg-red-400/10",        dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" },
  new:      { label: "New",      color: "text-blue-400 bg-blue-400/10",      dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" },
};

export const TIER_CONFIG = {
  enterprise:   { label: "Enterprise", color: "text-violet-400 bg-violet-400/10" },
  "mid-market": { label: "Mid-Market", color: "text-amber-400 bg-amber-400/10" },
  startup:      { label: "Startup",    color: "text-blue-400 bg-blue-400/10" },
  smb:          { label: "SMB",        color: "text-slate-400 bg-slate-400/10" },
};
