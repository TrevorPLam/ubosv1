/**
 * @file        artifacts/ai-command-center/src/pages/EmailInboxPage.tsx
 * @module      Pages / Email
 * @purpose     Email inbox page with multi-account support, compose, and email management
 *
 * @ai_instructions
 *   - Must support multiple email providers (Gmail, Outlook, etc.)
 *   - Must provide compose, reply, and email management functionality
 *   - Must maintain folder navigation and email state properly
 *   - DO NOT modify the email data structure without updating all email components
 *
 * @exports     EmailInboxPage
 * @imports     @/lib/utils, @/components/ui, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Inbox, Send, FileText, Trash2, Archive, Star, StarOff,
  Search, Plus, RefreshCw, Filter, MoreHorizontal, ChevronDown,
  Paperclip, Tag, Clock, CheckCheck, AlertCircle, Loader2,
  Mail, Link2, Settings, ChevronRight, X, Reply, ReplyAll,
  Forward, ExternalLink, Folder, ZapIcon, Eye, EyeOff,
  SlidersHorizontal, SquarePen,
} from "lucide-react";

const GMAIL_RED = "#EA4335";
const OUTLOOK_BLUE = "#0078D4";

const CONNECTED_ACCOUNTS = [
  { id: "g1", provider: "gmail", email: "alex@company.com", name: "Alex Morgan", color: GMAIL_RED, unread: 12 },
  { id: "o1", provider: "outlook", email: "alex.morgan@corp.com", name: "Alex Morgan", color: OUTLOOK_BLUE, unread: 4 },
];

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: Inbox, count: 16 },
  { id: "starred", label: "Starred", icon: Star, count: 3 },
  { id: "sent", label: "Sent", icon: Send, count: 0 },
  { id: "drafts", label: "Drafts", icon: FileText, count: 2 },
  { id: "archive", label: "Archive", icon: Archive, count: 0 },
  { id: "trash", label: "Trash", icon: Trash2, count: 0 },
];

const LABELS = [
  { id: "l1", name: "Important", color: "bg-red-400" },
  { id: "l2", name: "Work", color: "bg-blue-400" },
  { id: "l3", name: "Personal", color: "bg-emerald-400" },
  { id: "l4", name: "Finance", color: "bg-amber-400" },
  { id: "l5", name: "Follow-up", color: "bg-violet-400" },
];

const EMAILS = [
  {
    id: "e1", folder: "inbox", account: "g1", starred: true,
    from: "Sarah Chen", fromEmail: "sarah.chen@partner.io",
    to: "alex@company.com", subject: "Q2 Partnership Proposal — Action Required",
    preview: "Hi Alex, following up on our meeting last Thursday. I've attached the revised proposal with the updated pricing tiers and SLA commitments...",
    body: `Hi Alex,

Following up on our meeting last Thursday. I've attached the revised proposal with the updated pricing tiers and SLA commitments we discussed.

Key changes from the previous version:
• Tier 2 now includes 24/7 support (previously business hours only)
• Pricing adjusted to $4,800/mo (down from $5,500)
• Implementation timeline reduced to 3 weeks

Please review and let me know if these terms work for your team. We'd love to move forward before end of month.

Best,
Sarah Chen
Director of Partnerships, Partner.io`,
    time: "10:32 AM", date: "Today", unread: true, labels: ["l1", "l2"],
    attachments: [{ name: "Q2_Partnership_Proposal_v3.pdf", size: "2.4 MB" }],
    provider: "gmail",
  },
  {
    id: "e2", folder: "inbox", account: "o1", starred: false,
    from: "David Park", fromEmail: "d.park@enterprise.com",
    to: "alex.morgan@corp.com", subject: "Re: Invoice #4421 — Payment Confirmation",
    preview: "Hi, just wanted to confirm we processed payment for invoice #4421 yesterday. The funds should clear by Thursday. Please let us know if anything is outstanding...",
    body: `Hi,

Just wanted to confirm we processed payment for invoice #4421 yesterday. The funds should clear by Thursday.

Payment Details:
• Invoice: #4421
• Amount: $12,400.00
• Reference: ENT-PAY-20260506
• Method: ACH Transfer

Please let us know if anything else is outstanding or if there are any issues on your end.

Thanks,
David Park
Accounts Payable`,
    time: "9:17 AM", date: "Today", unread: true, labels: ["l4"],
    attachments: [],
    provider: "outlook",
  },
  {
    id: "e3", folder: "inbox", account: "g1", starred: false,
    from: "Notion", fromEmail: "notify@mail.notion.so",
    to: "alex@company.com", subject: "Marcus left a comment on 'Product Roadmap Q3'",
    preview: "@Alex can you take a look at the timeline for the onboarding feature? I think we might be underestimating the backend work...",
    body: `Marcus left a comment on Product Roadmap Q3:

"@Alex can you take a look at the timeline for the onboarding feature? I think we might be underestimating the backend work by about 2 weeks."

View comment → https://notion.so/...`,
    time: "8:55 AM", date: "Today", unread: true, labels: ["l2"],
    attachments: [],
    provider: "gmail",
  },
  {
    id: "e4", folder: "inbox", account: "g1", starred: true,
    from: "Jennifer Wu", fromEmail: "jen@designstudio.co",
    to: "alex@company.com", subject: "Brand refresh assets — ready for review",
    preview: "Hey Alex! The updated brand assets are ready. I've packaged everything into Figma and a downloadable ZIP. The new color palette is much more versatile...",
    body: `Hey Alex!

The updated brand assets are ready. I've packaged everything into Figma and a downloadable ZIP.

What's included:
• New logo variants (light, dark, icon-only)
• Updated color palette with accessibility scores
• Typography specimens
• Component library with 40+ components
• Brand guidelines PDF

The new color palette is much more versatile and should work well across print and digital. Let me know what you think!

Figma link: https://figma.com/file/...

Jen`,
    time: "Yesterday", date: "May 6", unread: false, labels: ["l3"],
    attachments: [
      { name: "BrandAssets_v2.zip", size: "48.2 MB" },
      { name: "BrandGuidelines.pdf", size: "6.1 MB" },
    ],
    provider: "gmail",
  },
  {
    id: "e5", folder: "inbox", account: "o1", starred: false,
    from: "Tom Brennan", fromEmail: "tom.brennan@legalfirm.law",
    to: "alex.morgan@corp.com", subject: "NDA for Review — CounterSign Needed",
    preview: "Please find attached the NDA for the upcoming vendor engagement. We've incorporated the mutual confidentiality clause you requested. Please review, sign and return by Friday...",
    body: `Alex,

Please find attached the NDA for the upcoming vendor engagement. We've incorporated the mutual confidentiality clause you requested.

The agreement covers:
• 3-year term
• Mutual confidentiality
• Standard carve-outs (publicly available info, independently developed)
• Jurisdiction: Delaware

Please review, sign and return by Friday, May 10th. Use the DocuSign link if you prefer digital signing.

DocuSign → https://docusign.net/...

Best regards,
Tom Brennan, Esq.`,
    time: "May 5", date: "May 5", unread: false, labels: ["l1", "l2"],
    attachments: [{ name: "NDA_VendorEngagement_Draft.docx", size: "340 KB" }],
    provider: "outlook",
  },
  {
    id: "e6", folder: "inbox", account: "g1", starred: false,
    from: "GitHub", fromEmail: "noreply@github.com",
    to: "alex@company.com", subject: "[ai-command-center] Pull request #84 opened by mdevries",
    preview: "mdevries opened pull request #84: feat: add vector search to knowledge base. Changes: +420 -18 across 12 files...",
    body: `mdevries opened pull request #84 in ai-command-center:

feat: add vector search to knowledge base

Changes: +420 -18 across 12 files
• Adds pgvector extension support
• New semantic search endpoint
• Updates KnowledgeBasePage to support hybrid search

Review pull request → https://github.com/...`,
    time: "May 5", date: "May 5", unread: false, labels: ["l2"],
    attachments: [],
    provider: "gmail",
  },
  {
    id: "e7", folder: "starred", account: "g1", starred: true,
    from: "Sarah Chen", fromEmail: "sarah.chen@partner.io",
    to: "alex@company.com", subject: "Q1 Results — Strong quarter across the board",
    preview: "Hi team, sharing the Q1 results summary. We exceeded targets in three out of four regions. Full report attached...",
    body: `Hi team,

Sharing the Q1 results summary. We exceeded targets in three out of four regions.

Highlights:
• Revenue: $2.4M (target: $2.1M) ↑14%
• Churn: 2.1% (target: <3%) ✓
• NPS: 72 (target: 65) ✓
• Enterprise deals closed: 8 (target: 6) ✓

Full report attached. Great work everyone!

Sarah`,
    time: "Apr 30", date: "Apr 30", unread: false, labels: ["l1"],
    attachments: [{ name: "Q1_2026_Results.pdf", size: "1.8 MB" }],
    provider: "gmail",
  },
  {
    id: "e8", folder: "drafts", account: "g1", starred: false,
    from: "alex@company.com", fromEmail: "alex@company.com",
    to: "board@company.com", subject: "Board Update — May 2026",
    preview: "Dear Board Members, I'm writing to share our May progress update. This month we hit several key milestones...",
    body: `Dear Board Members,

I'm writing to share our May progress update. This month we hit several key milestones:

[DRAFT — needs completion]`,
    time: "May 4", date: "May 4", unread: false, labels: [],
    attachments: [],
    provider: "gmail",
  },
];

function ProviderIcon({ provider, size = 14 }: { provider: string; size?: number }) {
  if (provider === "gmail") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 13L4 6H20ZM20 18H4V8L12 15L20 8V18Z" fill={GMAIL_RED} />
      </svg>
    );
  }
  if (provider === "outlook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="14" height="16" rx="2" fill={OUTLOOK_BLUE} />
        <path d="M9 8C7.3 8 6 9.6 6 12C6 14.4 7.3 16 9 16C10.7 16 12 14.4 12 12C12 9.6 10.7 8 9 8Z" fill="white" />
        <rect x="14" y="4" width="8" height="10" rx="1" fill="#0058A3" />
        <path d="M14 10L18 13L22 10" stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }
  return <Mail size={size} />;
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", color, sz)}>
      {initials}
    </div>
  );
}

function ComposeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); onClose(); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border bg-muted/40">
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <SquarePen className="w-4 h-4 text-muted-foreground" />
            New Message
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground w-10 shrink-0">From</span>
            <select className="flex-1 bg-transparent text-sm text-foreground outline-none">
              {CONNECTED_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.email}>{a.name} &lt;{a.email}&gt;</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground w-10 shrink-0">To</span>
            <Input
              value={to} onChange={(e) => setTo(e.target.value)}
              placeholder="recipients@example.com"
              className="flex-1 border-0 shadow-none p-0 h-7 text-sm focus-visible:ring-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Subject</span>
            <Input
              value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 border-0 shadow-none p-0 h-7 text-sm focus-visible:ring-0 bg-transparent"
            />
          </div>
          <Textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[200px] text-sm px-4 py-3"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSend} disabled={sending} className="h-8 text-xs gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? "Sending…" : "Send"}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
                <Paperclip className="w-3.5 h-3.5" /> Attach
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
                <Tag className="w-3.5 h-3.5" /> Label
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onClose}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const providers = [
    { id: "gmail", name: "Gmail", desc: "Connect your Google account", color: GMAIL_RED, icon: "gmail" },
    { id: "outlook", name: "Outlook", desc: "Connect Microsoft 365 or Outlook.com", color: OUTLOOK_BLUE, icon: "outlook" },
    { id: "imap", name: "Custom IMAP", desc: "Connect any email via IMAP/SMTP", color: "#6366F1", icon: null },
    { id: "yahoo", name: "Yahoo Mail", desc: "Connect your Yahoo account", color: "#6001D2", icon: null },
    { id: "apple", name: "Apple Mail", desc: "Connect iCloud Mail", color: "#555555", icon: null },
  ];

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => { setConnecting(null); onClose(); }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-primary" /> Connect Email Account
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleConnect(p.id)}
              disabled={!!connecting}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: p.color + "22" }}>
                {p.icon ? (
                  <ProviderIcon provider={p.icon} size={18} />
                ) : (
                  <Mail size={18} style={{ color: p.color }} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.desc}</div>
              </div>
              {connecting === p.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-1">
          OAuth 2.0 secured. We never store your password.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function EmailInboxPage() {
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<string | null>("e1");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [starred, setStarred] = useState<Record<string, boolean>>(
    Object.fromEntries(EMAILS.map((e) => [e.id, e.starred]))
  );
  const [read, setRead] = useState<Record<string, boolean>>(
    Object.fromEntries(EMAILS.map((e) => [e.id, !e.unread]))
  );
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");

  const filteredEmails = EMAILS.filter((e) => {
    const matchFolder = e.folder === selectedFolder || selectedFolder === "starred" && starred[e.id];
    const matchSearch = !searchQuery || [e.subject, e.from, e.preview].some((f) =>
      f.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchFolder && matchSearch;
  });

  const activeEmail = EMAILS.find((e) => e.id === selectedEmail) ?? null;

  const handleSelectEmail = (id: string) => {
    setSelectedEmail(id);
    setRead((r) => ({ ...r, [id]: true }));
    setReplyMode(false);
    setReplyText("");
  };

  const totalUnread = EMAILS.filter((e) => !read[e.id] && e.folder === "inbox").length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-sidebar">
        <div className="px-3 pt-4 pb-2">
          <Button
            size="sm"
            className="w-full gap-2 h-9 text-xs justify-start"
            onClick={() => setComposeOpen(true)}
          >
            <SquarePen className="w-4 h-4" /> Compose
          </Button>
        </div>

        {/* Connected accounts */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Accounts</span>
            <button
              onClick={() => setConnectOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {CONNECTED_ACCOUNTS.map((acct) => (
              <div key={acct.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 cursor-pointer">
                <ProviderIcon provider={acct.provider} size={13} />
                <span className="text-xs text-sidebar-foreground/80 truncate flex-1">{acct.email}</span>
                {acct.unread > 0 && (
                  <span className="text-[10px] font-bold text-primary">{acct.unread}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border mx-3 my-1" />

        {/* Folders */}
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Folders</span>
          <nav className="flex flex-col gap-0.5">
            {FOLDERS.map((f) => {
              const unreadCount = f.id === "inbox" ? totalUnread : f.id === "starred" ? Object.values(starred).filter(Boolean).length : f.count;
              const isActive = selectedFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <f.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left">{f.label}</span>
                  {unreadCount > 0 && (
                    <span className={cn("text-[10px] font-bold", isActive ? "text-sidebar-accent-foreground" : "text-primary")}>{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="h-px bg-border mx-3 my-1" />

        {/* Labels */}
        <div className="px-3 py-2 flex-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Labels</span>
          <div className="flex flex-col gap-0.5">
            {LABELS.map((l) => (
              <button key={l.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                <span className={cn("w-2 h-2 rounded-full shrink-0", l.color)} />
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => setConnectOpen(true)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Link2 className="w-3.5 h-3.5" /> Connect account
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        {/* List header */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm capitalize text-foreground">
              {FOLDERS.find((f) => f.id === selectedFolder)?.label ?? selectedFolder}
              {totalUnread > 0 && selectedFolder === "inbox" && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({totalUnread} unread)</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="text-xs">All mail</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">Unread only</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs">Newest first</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">Oldest first</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails…"
              className="pl-8 h-8 text-xs bg-muted/40"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Inbox className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No messages</p>
            </div>
          ) : (
            <div>
              {filteredEmails.map((email) => {
                const isActive = selectedEmail === email.id;
                const isRead = read[email.id];
                const isStarred = starred[email.id];
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectEmail(email.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border/50 transition-colors relative cursor-pointer",
                      isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/40",
                      !isRead && !isActive && "bg-muted/20"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5">
                        <Avatar name={email.from} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn("text-xs truncate", !isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                            {email.from}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <ProviderIcon provider={email.provider} size={10} />
                            <span className="text-[10px] text-muted-foreground">{email.time}</span>
                          </div>
                        </div>
                        <div className={cn("text-xs truncate mb-1", !isRead ? "font-medium text-foreground" : "text-foreground/70")}>
                          {email.subject}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{email.preview}</div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {email.attachments.length > 0 && (
                            <Paperclip className="w-3 h-3 text-muted-foreground/60" />
                          )}
                          {email.labels.map((lid) => {
                            const label = LABELS.find((l) => l.id === lid);
                            return label ? (
                              <span key={lid} className={cn("w-1.5 h-1.5 rounded-full", label.color)} />
                            ) : null;
                          })}
                        </div>
                      </div>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setStarred((s) => ({ ...s, [email.id]: !s[email.id] })); }}
                        className="text-muted-foreground/40 hover:text-amber-400 transition-colors mt-0.5 shrink-0"
                      >
                        {isStarred ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {!isRead && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Email detail */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeEmail ? (
          <>
            {/* Detail header */}
            <div className="px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-base font-semibold text-foreground leading-tight flex-1">{activeEmail.subject}</h2>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => setStarred((s) => ({ ...s, [activeEmail.id]: !s[activeEmail.id] }))}>
                    {starred[activeEmail.id] ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : <Star className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="text-xs gap-2"><Eye className="w-3.5 h-3.5" />Mark as unread</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2"><Tag className="w-3.5 h-3.5" />Add label</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2"><ZapIcon className="w-3.5 h-3.5" />Create automation</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs gap-2"><ExternalLink className="w-3.5 h-3.5" />Open in provider</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 text-destructive"><Trash2 className="w-3.5 h-3.5" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Sender row */}
              <div className="flex items-center gap-3">
                <Avatar name={activeEmail.from} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{activeEmail.from}</span>
                    <span className="text-xs text-muted-foreground">&lt;{activeEmail.fromEmail}&gt;</span>
                    <div className="flex items-center gap-1">
                      <ProviderIcon provider={activeEmail.provider} size={12} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>To: {activeEmail.to}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{activeEmail.date}, {activeEmail.time}</span>
                  </div>
                </div>
                {/* Labels */}
                <div className="flex items-center gap-1 shrink-0">
                  {activeEmail.labels.map((lid) => {
                    const label = LABELS.find((l) => l.id === lid);
                    return label ? (
                      <Badge key={lid} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", label.color)} />
                        {label.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Email body */}
            <ScrollArea className="flex-1 px-6 py-5">
              <div className="max-w-2xl">
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-sans">
                  {activeEmail.body}
                </div>

                {/* Attachments */}
                {activeEmail.attachments.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> {activeEmail.attachments.length} Attachment{activeEmail.attachments.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeEmail.attachments.map((att) => (
                        <div key={att.name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-foreground">{att.name}</div>
                            <div className="text-[10px] text-muted-foreground">{att.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply toolbar */}
            <div className="shrink-0 border-t border-border px-6 py-3">
              {!replyMode ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setReplyMode(true)}>
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setReplyMode(true)}>
                    <ReplyAll className="w-3.5 h-3.5" /> Reply All
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Forward className="w-3.5 h-3.5" /> Forward
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground flex items-center justify-between">
                    <span>Reply to {activeEmail.from}</span>
                    <button onClick={() => setReplyMode(false)} className="hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply…"
                    className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[90px] text-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/10">
                    <Button size="sm" className="h-7 text-xs gap-1.5">
                      <Send className="w-3 h-3" /> Send
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground">
                      <Paperclip className="w-3 h-3" /> Attach
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
              <Mail className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Select an email to read</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Or compose a new message</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-2" onClick={() => setComposeOpen(true)}>
              <SquarePen className="w-3.5 h-3.5" /> Compose
            </Button>
          </div>
        )}
      </div>

      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
      <ConnectAccountDialog open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}
