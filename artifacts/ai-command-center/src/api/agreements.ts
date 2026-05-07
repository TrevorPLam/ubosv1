export type AgreementStatus = "signed" | "viewed" | "sent" | "draft" | "expired";

export interface Agreement {
  id: string;
  title: string;
  contact: string;
  company: string;
  clientId: string;
  value: string;
  status: AgreementStatus;
  sent: string;
  opened: string;
  engagementScore: number;
}

export let mockAgreements: Agreement[] = [
  {
    id: "AGR-0018",
    title: "Enterprise Platform Agreement",
    contact: "Ava Thompson",
    company: "VertexOps",
    clientId: "client-1",
    value: "$210,000",
    status: "signed",
    sent: "Apr 30, 2026",
    opened: "12 times",
    engagementScore: 94,
  },
  {
    id: "AGR-0017",
    title: "Q2 Consulting Engagement",
    contact: "Sarah Chen",
    company: "Acme Corp",
    clientId: "client-3",
    value: "$120,000",
    status: "viewed",
    sent: "May 3, 2026",
    opened: "4 times",
    engagementScore: 71,
  },
  {
    id: "AGR-0016",
    title: "Software License Proposal",
    contact: "Yuki Tanaka",
    company: "Synth.jp",
    clientId: "client-2",
    value: "$85,000",
    status: "sent",
    sent: "May 5, 2026",
    opened: "1 time",
    engagementScore: 42,
  },
  {
    id: "AGR-0015",
    title: "Mid-Market Growth Package",
    contact: "Marcus Webb",
    company: "TechFlow",
    clientId: "client-5",
    value: "$35,000",
    status: "draft",
    sent: "—",
    opened: "—",
    engagementScore: 0,
  },
  {
    id: "AGR-0014",
    title: "Pilot Program Contract",
    contact: "Elena Vasquez",
    company: "CloudPeak",
    clientId: "client-4",
    value: "$47,000",
    status: "expired",
    sent: "Mar 15, 2026",
    opened: "3 times",
    engagementScore: 38,
  },
];
