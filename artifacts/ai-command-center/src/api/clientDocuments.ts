export type DocStatus = "approved" | "pending" | "draft" | "requires_signature" | "expired";
export type DocType = "pdf" | "spreadsheet" | "doc" | "image" | "code";
export type AccessLevel = "private" | "team" | "public";

export interface ClientDocument {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  access: AccessLevel;
  owner: string;
  modified: string;
  size: string;
  folder: string;
  starred: boolean;
  version: string;
  tags: string[];
  clientId: string;
}

export let mockClientDocuments: ClientDocument[] = [
  {
    id: "cd-1",
    name: "Master Service Agreement – VertexOps",
    type: "pdf",
    status: "signed" as any,
    access: "private",
    owner: "You",
    modified: "2026-05-06",
    size: "1.2 MB",
    folder: "contracts",
    starred: true,
    version: "v2.0",
    tags: ["legal", "signed"],
    clientId: "client-1",
  },
  {
    id: "cd-2",
    name: "VertexOps Onboarding Pack",
    type: "doc",
    status: "approved",
    access: "team",
    owner: "You",
    modified: "2026-04-15",
    size: "890 KB",
    folder: "onboarding",
    starred: false,
    version: "v1.0",
    tags: ["onboarding"],
    clientId: "client-1",
  },
  {
    id: "cd-3",
    name: "Q2 Consulting Engagement – Acme Corp",
    type: "pdf",
    status: "requires_signature",
    access: "private",
    owner: "You",
    modified: "2026-05-03",
    size: "780 KB",
    folder: "contracts",
    starred: true,
    version: "v1.1",
    tags: ["legal", "urgent"],
    clientId: "client-3",
  },
  {
    id: "cd-4",
    name: "Software License Proposal – Synth.jp",
    type: "pdf",
    status: "sent" as any,
    access: "private",
    owner: "Sales Agent",
    modified: "2026-05-05",
    size: "540 KB",
    folder: "contracts",
    starred: false,
    version: "v1.0",
    tags: ["legal"],
    clientId: "client-2",
  },
  {
    id: "cd-5",
    name: "Pilot Program Contract – CloudPeak",
    type: "pdf",
    status: "expired",
    access: "private",
    owner: "You",
    modified: "2026-04-20",
    size: "620 KB",
    folder: "contracts",
    starred: false,
    version: "v1.0",
    tags: ["legal", "expired"],
    clientId: "client-4",
  },
  {
    id: "cd-6",
    name: "TechFlow Onboarding Checklist",
    type: "doc",
    status: "draft",
    access: "team",
    owner: "You",
    modified: "2026-05-07",
    size: "120 KB",
    folder: "onboarding",
    starred: false,
    version: "v1.0-draft",
    tags: ["onboarding"],
    clientId: "client-5",
  },
];
