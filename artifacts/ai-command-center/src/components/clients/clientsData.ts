/**
 * @file        artifacts/ai-command-center/src/components/clients/clientsData.ts
 * @module      AI Command Center / Clients
 * @purpose     Client data types, mock data, and utility functions for CRM functionality
 *
 * @ai_instructions
 *   - All client statuses must be from the ClientStatus union type.
 *   - Mock data must include realistic client information and contact details.
 *   - Address helper functions must return complete address objects.
 *   - DO NOT modify status values without updating UI components.
 *
 * @exports     ClientStatus, Salutation, Gender, EmailType, PhoneType, SocialPlatform, Client, clientDisplayName, mockClients, STATUS_CONFIG, LANGUAGES, COUNTRIES
 * @imports     None
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export type ClientStatus = "active" | "inactive" | "at-risk" | "new";

export type Salutation = "" | "Mr." | "Ms." | "Mrs." | "Dr." | "Prof.";
export type Gender = "" | "Male" | "Female" | "Non-binary" | "Prefer not to say";
export type EmailType = "Work" | "Personal" | "Other";
export type PhoneType = "Mobile" | "Work" | "Home" | "Fax" | "Other";
export type SocialPlatform = "LinkedIn" | "Twitter/X" | "Facebook" | "Instagram" | "Other";

export interface EmailEntry { id: string; type: EmailType; email: string; primary: boolean; }
export interface PhoneEntry { id: string; type: PhoneType; number: string; primary: boolean; }
export interface WebsiteEntry { id: string; url: string; label: string; }
export interface SocialEntry { id: string; platform: SocialPlatform; url: string; }

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const emptyAddress = (): Address => ({ street: "", city: "", state: "", postalCode: "", country: "" });

export interface Client {
  id: string;

  salutation: Salutation;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  preferredName: string;
  dateOfBirth: string;
  gender: Gender;
  preferredLanguage: string;
  company: string;
  jobTitle: string;

  status: ClientStatus;
  source: "crm" | "direct";
  crmContactId?: number;
  lastActivity: string;

  emails: EmailEntry[];
  phones: PhoneEntry[];
  websites: WebsiteEntry[];
  socialProfiles: SocialEntry[];

  physicalAddress: Address;
  mailingAddress: Address;
  businessAddress: Address;

  clientOwner: string;
  notes: string;
  tags: string[];

  linkedProjectIds: string[];
  linkedDocumentIds: string[];
  linkedAgreementIds: string[];
}

export function clientDisplayName(c: Client): string {
  return [c.salutation, c.firstName, c.middleName, c.lastName, c.suffix].filter(Boolean).join(" ");
}

export let mockClients: Client[] = [
  {
    id: "client-1",
    salutation: "Ms.", firstName: "Ava", middleName: "", lastName: "Thompson", suffix: "",
    preferredName: "Ava", dateOfBirth: "1987-03-14", gender: "Female", preferredLanguage: "English",
    company: "VertexOps", jobTitle: "Chief Revenue Officer",
    status: "active", source: "crm", crmContactId: 8, lastActivity: "1h ago",
    emails: [
      { id: "e1", type: "Work", email: "ava.t@vertexops.com", primary: true },
      { id: "e2", type: "Personal", email: "ava.thompson@gmail.com", primary: false },
    ],
    phones: [
      { id: "p1", type: "Mobile", number: "+1 415 555 0176", primary: true },
      { id: "p2", type: "Work", number: "+1 415 555 0100", primary: false },
    ],
    websites: [{ id: "w1", url: "vertexops.com", label: "Company" }],
    socialProfiles: [
      { id: "s1", platform: "LinkedIn", url: "linkedin.com/in/avathompson" },
      { id: "s2", platform: "Twitter/X", url: "x.com/avathompson" },
    ],
    physicalAddress: { street: "1 Market St, Suite 300", city: "San Francisco", state: "CA", postalCode: "94105", country: "United States" },
    mailingAddress: emptyAddress(),
    businessAddress: { street: "1 Market St, Suite 300", city: "San Francisco", state: "CA", postalCode: "94105", country: "United States" },
    clientOwner: "Jordan Kim",
    notes: "Key stakeholder. Expanding seats in Q3. Prefers async updates over calls.",
    tags: ["Enterprise", "Champion"],
    linkedProjectIds: ["proj-1", "proj-3"],
    linkedDocumentIds: ["cd-1", "cd-2"],
    linkedAgreementIds: ["AGR-0018"],
  },
  {
    id: "client-2",
    salutation: "Mr.", firstName: "Yuki", middleName: "", lastName: "Tanaka", suffix: "",
    preferredName: "Yuki", dateOfBirth: "1991-07-22", gender: "Male", preferredLanguage: "Japanese",
    company: "Synth.jp", jobTitle: "VP of Engineering",
    status: "active", source: "crm", crmContactId: 5, lastActivity: "30m ago",
    emails: [{ id: "e3", type: "Work", email: "y.tanaka@synth.jp", primary: true }],
    phones: [{ id: "p3", type: "Work", number: "+81 3 5555 0123", primary: true }],
    websites: [{ id: "w2", url: "synth.jp", label: "Company" }],
    socialProfiles: [{ id: "s3", platform: "LinkedIn", url: "linkedin.com/in/yukitanaka" }],
    physicalAddress: { street: "2-1-1 Marunouchi", city: "Tokyo", state: "Tokyo", postalCode: "100-0005", country: "Japan" },
    mailingAddress: emptyAddress(),
    businessAddress: emptyAddress(),
    clientOwner: "Jordan Kim",
    notes: "Renewal due in Oct. High satisfaction score. Prefers communication in English.",
    tags: ["Enterprise", "Renewal"],
    linkedProjectIds: ["proj-2"],
    linkedDocumentIds: ["cd-4"],
    linkedAgreementIds: ["AGR-0016"],
  },
  {
    id: "client-3",
    salutation: "Ms.", firstName: "Sarah", middleName: "", lastName: "Chen", suffix: "",
    preferredName: "Sarah", dateOfBirth: "1985-11-05", gender: "Female", preferredLanguage: "English",
    company: "Acme Corp", jobTitle: "Director of Operations",
    status: "active", source: "crm", crmContactId: 1, lastActivity: "2h ago",
    emails: [{ id: "e4", type: "Work", email: "sarah.chen@acme.com", primary: true }],
    phones: [
      { id: "p4", type: "Work", number: "+1 415 555 0101", primary: true },
      { id: "p5", type: "Mobile", number: "+1 415 555 0102", primary: false },
    ],
    websites: [{ id: "w3", url: "acme.com", label: "Company" }],
    socialProfiles: [{ id: "s4", platform: "LinkedIn", url: "linkedin.com/in/sarahchen" }],
    physicalAddress: { street: "350 Mission St", city: "San Francisco", state: "CA", postalCode: "94105", country: "United States" },
    mailingAddress: emptyAddress(),
    businessAddress: emptyAddress(),
    clientOwner: "Alex Rivera",
    notes: "Interested in advanced analytics add-on. Decision maker for Q3 renewal.",
    tags: ["Mid-Market", "Decision Maker"],
    linkedProjectIds: ["proj-1"],
    linkedDocumentIds: ["cd-3"],
    linkedAgreementIds: ["AGR-0017"],
  },
  {
    id: "client-4",
    salutation: "Ms.", firstName: "Elena", middleName: "", lastName: "Vasquez", suffix: "",
    preferredName: "Elena", dateOfBirth: "1990-02-28", gender: "Female", preferredLanguage: "English",
    company: "CloudPeak", jobTitle: "CEO",
    status: "at-risk", source: "crm", crmContactId: 6, lastActivity: "3d ago",
    emails: [{ id: "e5", type: "Work", email: "elena@cloudpeak.io", primary: true }],
    phones: [{ id: "p6", type: "Mobile", number: "+1 303 555 0167", primary: true }],
    websites: [{ id: "w4", url: "cloudpeak.io", label: "Company" }],
    socialProfiles: [
      { id: "s5", platform: "LinkedIn", url: "linkedin.com/in/elenavasquez" },
      { id: "s6", platform: "Twitter/X", url: "x.com/elenavasquez" },
    ],
    physicalAddress: { street: "1600 Glenarm Pl", city: "Denver", state: "CO", postalCode: "80202", country: "United States" },
    mailingAddress: emptyAddress(),
    businessAddress: emptyAddress(),
    clientOwner: "Jordan Kim",
    notes: "Usage dropped 40% last month. Schedule check-in immediately.",
    tags: ["Mid-Market", "Pilot"],
    linkedProjectIds: [],
    linkedDocumentIds: ["cd-5"],
    linkedAgreementIds: ["AGR-0014"],
  },
  {
    id: "client-5",
    salutation: "Mr.", firstName: "Marcus", middleName: "", lastName: "Webb", suffix: "",
    preferredName: "Marcus", dateOfBirth: "1994-09-17", gender: "Male", preferredLanguage: "English",
    company: "TechFlow", jobTitle: "CTO",
    status: "new", source: "crm", crmContactId: 2, lastActivity: "5h ago",
    emails: [{ id: "e6", type: "Work", email: "m.webb@techflow.io", primary: true }],
    phones: [{ id: "p7", type: "Mobile", number: "+1 628 555 0182", primary: true }],
    websites: [{ id: "w5", url: "techflow.io", label: "Company" }],
    socialProfiles: [{ id: "s7", platform: "LinkedIn", url: "linkedin.com/in/marcuswebb" }],
    physicalAddress: emptyAddress(),
    mailingAddress: emptyAddress(),
    businessAddress: { street: "855 Howard St", city: "San Francisco", state: "CA", postalCode: "94103", country: "United States" },
    clientOwner: "Alex Rivera",
    notes: "Onboarding in progress. First check-in scheduled for next week.",
    tags: ["Startup", "Evaluating"],
    linkedProjectIds: ["proj-2"],
    linkedDocumentIds: ["cd-6"],
    linkedAgreementIds: ["AGR-0015"],
  },
];

export const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "Active",   color: "text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" },
  inactive:  { label: "Inactive", color: "text-slate-400 bg-slate-400/10",    dot: "bg-slate-400" },
  "at-risk": { label: "At Risk",  color: "text-red-400 bg-red-400/10",        dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" },
  new:       { label: "New",      color: "text-blue-400 bg-blue-400/10",      dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" },
};

export const LANGUAGES = [
  "English", "Spanish", "French", "German", "Japanese", "Mandarin Chinese",
  "Cantonese", "Portuguese", "Arabic", "Hindi", "Korean", "Italian", "Russian",
  "Dutch", "Swedish", "Polish", "Vietnamese", "Thai", "Other",
];

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Japan", "China", "India", "Brazil", "Mexico", "Spain", "Italy", "Netherlands",
  "Sweden", "Norway", "Denmark", "Finland", "Switzerland", "Singapore", "South Korea",
  "United Arab Emirates", "South Africa", "New Zealand", "Other",
];
