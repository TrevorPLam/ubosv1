import { mockFetch } from "./client";

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export const mockProjects: Project[] = [
  { id: "proj-1", name: "Alpha Pipeline", status: "active", createdAt: "2023-10-01T00:00:00Z" },
  { id: "proj-2", name: "Data Ingestion v2", status: "active", createdAt: "2023-11-15T00:00:00Z" },
  { id: "proj-3", name: "Security Audit", status: "active", createdAt: "2023-12-05T00:00:00Z" },
];

export const getProjects = () => mockFetch(mockProjects, 250);
