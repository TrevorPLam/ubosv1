import { useState } from "react";
import {
  FileText, FileSpreadsheet, FileImage, FileCode, File,
  FolderOpen, Search, Upload, Plus, MoreHorizontal,
  Download, Share2, Trash2, Eye, Clock, CheckCircle2,
  AlertCircle, Lock, Globe, Users, ChevronRight, Filter,
  SortAsc, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DocStatus = "approved" | "pending" | "draft" | "requires_signature" | "expired";
type DocType = "pdf" | "spreadsheet" | "doc" | "image" | "code";
type AccessLevel = "private" | "team" | "public";

interface Document {
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
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

const folders: Folder[] = [
  { id: "all", name: "All Documents", count: 24 },
  { id: "contracts", name: "Contracts", count: 8 },
  { id: "reports", name: "Reports", count: 7 },
  { id: "onboarding", name: "Onboarding", count: 4 },
  { id: "compliance", name: "Compliance", count: 5 },
];

const mockDocuments: Document[] = [
  {
    id: "1", name: "Master Service Agreement – Acme Corp", type: "pdf",
    status: "requires_signature", access: "private", owner: "You",
    modified: "2026-05-06", size: "1.2 MB", folder: "contracts",
    starred: true, version: "v3.1", tags: ["legal", "urgent"]
  },
  {
    id: "2", name: "Q1 2026 Financial Report", type: "spreadsheet",
    status: "approved", access: "team", owner: "Finance Agent",
    modified: "2026-05-05", size: "4.8 MB", folder: "reports",
    starred: false, version: "v1.0", tags: ["finance", "q1"]
  },
  {
    id: "3", name: "Employee Handbook – May 2026", type: "doc",
    status: "pending", access: "team", owner: "HR Agent",
    modified: "2026-05-04", size: "890 KB", folder: "onboarding",
    starred: false, version: "v2.4", tags: ["hr"]
  },
  {
    id: "4", name: "SOC 2 Audit Evidence Package", type: "pdf",
    status: "approved", access: "private", owner: "Security Agent",
    modified: "2026-05-03", size: "22.1 MB", folder: "compliance",
    starred: true, version: "v1.2", tags: ["security", "audit"]
  },
  {
    id: "5", name: "Vendor NDA – TechPartner Inc", type: "pdf",
    status: "expired", access: "private", owner: "You",
    modified: "2026-04-20", size: "540 KB", folder: "contracts",
    starred: false, version: "v1.0", tags: ["legal", "nda"]
  },
  {
    id: "6", name: "System Architecture Diagram", type: "image",
    status: "approved", access: "team", owner: "Orchestrator Agent",
    modified: "2026-05-01", size: "3.3 MB", folder: "reports",
    starred: false, version: "v5.0", tags: ["architecture"]
  },
  {
    id: "7", name: "Data Processing Agreement – EU", type: "pdf",
    status: "requires_signature", access: "private", owner: "Legal Agent",
    modified: "2026-05-06", size: "780 KB", folder: "compliance",
    starred: true, version: "v2.0", tags: ["gdpr", "legal", "urgent"]
  },
  {
    id: "8", name: "Deployment Runbook v6", type: "code",
    status: "draft", access: "team", owner: "DevOps Agent",
    modified: "2026-05-07", size: "65 KB", folder: "reports",
    starred: false, version: "v6.0-draft", tags: ["ops"]
  },
  {
    id: "9", name: "Q4 2025 Board Presentation", type: "spreadsheet",
    status: "approved", access: "private", owner: "You",
    modified: "2026-01-15", size: "12.4 MB", folder: "reports",
    starred: false, version: "v1.0", tags: ["executive", "finance"]
  },
  {
    id: "10", name: "SaaS Subscription Agreement", type: "pdf",
    status: "pending", access: "team", owner: "Sales Agent",
    modified: "2026-05-05", size: "1.0 MB", folder: "contracts",
    starred: false, version: "v1.1", tags: ["sales", "legal"]
  },
];

const TYPE_ICONS: Record<DocType, React.ElementType> = {
  pdf: File,
  spreadsheet: FileSpreadsheet,
  doc: FileText,
  image: FileImage,
  code: FileCode,
};

const TYPE_COLORS: Record<DocType, string> = {
  pdf: "text-red-400",
  spreadsheet: "text-green-400",
  doc: "text-blue-400",
  image: "text-purple-400",
  code: "text-amber-400",
};

const STATUS_CONFIG: Record<DocStatus, { label: string; icon: React.ElementType; className: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, className: "text-green-500 bg-green-500/10" },
  pending: { label: "Pending Review", icon: Clock, className: "text-amber-500 bg-amber-500/10" },
  draft: { label: "Draft", icon: FileText, className: "text-muted-foreground bg-muted" },
  requires_signature: { label: "Needs Signature", icon: AlertCircle, className: "text-orange-500 bg-orange-500/10" },
  expired: { label: "Expired", icon: AlertCircle, className: "text-red-500 bg-red-500/10" },
};

const ACCESS_CONFIG: Record<AccessLevel, { icon: React.ElementType; label: string }> = {
  private: { icon: Lock, label: "Private" },
  team: { icon: Users, label: "Team" },
  public: { icon: Globe, label: "Public" },
};

function DocIcon({ type }: { type: DocType }) {
  const Icon = TYPE_ICONS[type];
  return <Icon className={cn("w-5 h-5 shrink-0", TYPE_COLORS[type])} />;
}

function StatusBadge({ status }: { status: DocStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full", cfg.className)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function AccessIcon({ access }: { access: AccessLevel }) {
  const cfg = ACCESS_CONFIG[access];
  const Icon = cfg.icon;
  return <Icon className="w-3.5 h-3.5 text-muted-foreground" title={cfg.label} />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const filterDocs = (docs: Document[]) => {
    let result = docs;
    if (activeFolder !== "all") result = result.filter(d => d.folder === activeFolder);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q)) ||
        d.owner.toLowerCase().includes(q)
      );
    }
    if (activeTab === "pending") result = result.filter(d => d.status === "pending" || d.status === "requires_signature");
    if (activeTab === "shared") result = result.filter(d => d.access === "team" || d.access === "public");
    if (activeTab === "starred") result = result.filter(d => d.starred);
    return result;
  };

  const filtered = filterDocs(mockDocuments);

  const pendingCount = mockDocuments.filter(d => d.status === "pending" || d.status === "requires_signature").length;
  const requiresSigCount = mockDocuments.filter(d => d.status === "requires_signature").length;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Folder sidebar */}
      <div className="w-52 shrink-0 border-r bg-sidebar/50 flex flex-col py-4 px-3 gap-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Folders</p>
        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => setActiveFolder(folder.id)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left w-full",
              activeFolder === folder.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </span>
            <span className="text-[11px] text-muted-foreground ml-1 shrink-0">{folder.count}</span>
          </button>
        ))}

        <div className="mt-auto pt-4 border-t">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors w-full">
            <Plus className="w-4 h-4" />
            New Folder
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-6 pb-0 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Documents</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">
                  {folders.find(f => f.id === activeFolder)?.name ?? "All Documents"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage, review, and share documents across your organization.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Document
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="border-0 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requiresSigCount}</p>
                  <p className="text-xs text-muted-foreground">Needs Signature</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-muted-foreground">Shared with Team</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs + search */}
          <div className="flex items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-3 gap-1">
                  Pending
                  {pendingCount > 0 && (
                    <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-amber-950 text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="shared" className="text-xs px-3">Shared</TabsTrigger>
                <TabsTrigger value="starred" className="text-xs px-3">Starred</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9 h-8 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Filter className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <SortAsc className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-sm">No documents match your search.</p>
            </div>
          ) : (
            <div className="border rounded-xl bg-card overflow-hidden divide-y">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_140px_120px_110px_80px_36px] gap-4 items-center px-4 py-2 bg-muted/30">
                <span className="w-5" />
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <span className="text-xs font-medium text-muted-foreground">Owner</span>
                <span className="text-xs font-medium text-muted-foreground">Modified</span>
                <span className="text-xs font-medium text-muted-foreground">Size</span>
                <span className="w-8" />
              </div>

              {filtered.map(doc => {
                const AccessIcon2 = ACCESS_CONFIG[doc.access].icon;
                return (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[auto_1fr_140px_120px_110px_80px_36px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    {/* Icon */}
                    <DocIcon type={doc.type} />

                    {/* Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {doc.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                        <span className="text-sm font-medium truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <AccessIcon2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{doc.version}</span>
                        {doc.tags.map(tag => (
                          <span key={tag} className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            tag === "urgent" ? "bg-red-500/15 text-red-400" : "bg-secondary text-secondary-foreground"
                          )}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <StatusBadge status={doc.status} />

                    {/* Owner */}
                    <span className="text-sm text-muted-foreground truncate">{doc.owner}</span>

                    {/* Modified */}
                    <span className="text-sm text-muted-foreground">{formatDate(doc.modified)}</span>

                    {/* Size */}
                    <span className="text-sm text-muted-foreground">{doc.size}</span>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="gap-2 text-sm">
                          <Eye className="w-4 h-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm">
                          <Download className="w-4 h-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm">
                          <Share2 className="w-4 h-4" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
