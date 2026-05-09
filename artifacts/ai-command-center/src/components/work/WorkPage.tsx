/**
 * @file        artifacts/ai-command-center/src/components/work/WorkPage.tsx
 * @module      AI Command Center / Work Management
 * @purpose     Comprehensive work management interface with task boards, project views, and calendar integration
 *
 * @ai_instructions
 *   - Task data must use the provided Project and Task types from @/api/projects.
 *   - Board view should support drag-and-drop reordering between status columns.
 *   - All date operations must use date-fns for consistency.
 *   - DO NOT modify the task status flow without updating the COLUMNS configuration.
 *
 * @exports     WorkPage
 * @imports     @tanstack/react-query, @/api/projects, @/components/ui/*, framer-motion, lucide-react, date-fns
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProjects, getTasks, createTask, type Project, type Task, type TaskStatus, type TaskPriority } from "@/api/projects";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus, FolderKanban, Bot, MessageSquare, ChevronRight, ChevronDown,
  Circle, Clock, Eye, CheckCircle2, AlertTriangle, Flag,
  LayoutGrid, List, Search, Filter, Sparkles, PanelRightClose, PanelRightOpen,
  Inbox, CalendarDays, LayoutTemplate, User, Users, AlignLeft,
  BarChart3, Table2, Mail, FileText, DollarSign, Link2,
  Timer, CheckSquare, GitBranch, ArrowRight, Zap, Star,
  Briefcase, Target, TrendingUp, AlertCircle, MoreHorizontal,
  ChevronLeft, Layers, RefreshCw, Tag, Building2
} from "lucide-react";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";

// ── Constants ─────────────────────────────────────────────────────────────────

type WorkSection = "mywork" | "triage" | "projects" | "templates" | "calendar";
type ViewMode = "board" | "list" | "timeline" | "workload" | "table";

const COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: "backlog",      label: "Backlog",     icon: <Circle className="w-3.5 h-3.5" />,       color: "text-zinc-400" },
  { status: "in-progress",  label: "In Progress", icon: <Clock className="w-3.5 h-3.5" />,        color: "text-blue-400" },
  { status: "in-review",    label: "In Review",   icon: <Eye className="w-3.5 h-3.5" />,          color: "text-purple-400" },
  { status: "done",         label: "Done",        icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-green-400" },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  low:      { label: "Low",      color: "text-zinc-400",  bg: "bg-zinc-500/10",  dot: "bg-zinc-400"  },
  medium:   { label: "Medium",   color: "text-blue-400",  bg: "bg-blue-500/10",  dot: "bg-blue-400"  },
  high:     { label: "High",     color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-400" },
  critical: { label: "Critical", color: "text-red-400",   bg: "bg-red-500/10",   dot: "bg-red-500"   },
};

const AGENT_OPTIONS = [
  { id: "agent-1", name: "Orchestrator" },
  { id: "agent-2", name: "ResearchBot" },
  { id: "agent-3", name: "CodeReviewer" },
  { id: "agent-4", name: "DataAnalyst" },
  { id: "agent-5", name: "DocumentWriter" },
  { id: "agent-6", name: "SecurityScanner" },
];

const PROJECT_COLORS: Record<string, string> = {
  "proj-1": "bg-blue-500",
  "proj-2": "bg-emerald-500",
  "proj-3": "bg-amber-500",
};

const PROJECT_DOT_COLORS: Record<string, string> = {
  "proj-1": "bg-blue-500",
  "proj-2": "bg-emerald-500",
  "proj-3": "bg-amber-500",
};

// ── Mock data for new sections ─────────────────────────────────────────────────

const TRIAGE_ITEMS = [
  { id: "t1", type: "email", from: "sarah@acmeco.com", subject: "Re: Q4 Deliverables — need update by Friday", preview: "Hi team, just following up on the Q4 roadmap. Can we get a status update before EOD Friday?", time: "2h ago", client: "Acme Co", suggested: "proj-1" },
  { id: "t2", type: "email", from: "mike@globex.io", subject: "Invoice dispute — Project Phoenix", preview: "We received invoice #1042 but the line items don't match what was agreed in the SOW...", time: "4h ago", client: "Globex", suggested: "proj-2" },
  { id: "t3", type: "request", from: "Alex Chen", subject: "Need design review for landing page", preview: "Internal request: The new landing page mockups are ready. Can someone from design review before we ship?", time: "Yesterday", client: null, suggested: "proj-1" },
  { id: "t4", type: "email", from: "jessica@startuphq.com", subject: "Onboarding checklist — missing items", preview: "We're on step 3 of onboarding and noticed the document upload section isn't working as expected.", time: "Yesterday", client: "StartupHQ", suggested: "proj-3" },
  { id: "t5", type: "request", from: "Jordan Reyes", subject: "Monthly reporting due — assign owner", preview: "Monthly client report for October is due next week. No owner assigned yet. Please assign.", time: "2 days ago", client: null, suggested: null },
];

const TEMPLATES = [
  { id: "tmpl-1", name: "Client Onboarding", description: "7-step workflow for new client setup", tasks: 12, category: "Client Services", icon: <Users className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10", tags: ["client", "recurring"] },
  { id: "tmpl-2", name: "Monthly Close", description: "Finance month-end close process with review gates", tasks: 18, category: "Finance", icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", tags: ["finance", "recurring"] },
  { id: "tmpl-3", name: "Content Launch", description: "End-to-end content production and publishing", tasks: 9, category: "Marketing", icon: <FileText className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10", tags: ["marketing"] },
  { id: "tmpl-4", name: "Tax Return Prep", description: "Full tax preparation workflow with client sign-off", tasks: 15, category: "Accounting", icon: <Briefcase className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10", tags: ["accounting", "recurring"] },
  { id: "tmpl-5", name: "Product Launch", description: "Cross-functional launch checklist with milestones", tasks: 24, category: "Product", icon: <Target className="w-5 h-5" />, color: "text-rose-400", bg: "bg-rose-500/10", tags: ["product"] },
  { id: "tmpl-6", name: "Vendor Onboarding", description: "Supplier qualification and contract setup", tasks: 8, category: "Operations", icon: <Building2 className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10", tags: ["vendor"] },
];

const MY_WORK_BUCKETS = [
  { id: "today",   label: "Today",   color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20"   },
  { id: "next",    label: "Next",    color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
  { id: "cleared", label: "Cleared", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
];

const TEAM_MEMBERS = [
  { id: "m1", name: "Alex Chen",    role: "Designer",   color: "bg-purple-500" },
  { id: "m2", name: "Jordan Reyes", role: "Engineer",   color: "bg-blue-500"   },
  { id: "m3", name: "Sam Park",     role: "PM",         color: "bg-emerald-500"},
  { id: "m4", name: "Mia Torres",   role: "Marketing",  color: "bg-rose-500"   },
];

// ── Shared sub-components ──────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.color, cfg.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function AgentChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
      <Bot className="w-2.5 h-2.5" />
      {name}
    </span>
  );
}

function IntegrationPill({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border", color)}>
      {icon}
      {label}
    </span>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick, compact = false }: { task: Task; onClick: () => void; compact?: boolean }) {
  const subtaskCount = Math.floor(Math.random() * 5);
  const hasDependent = Math.random() > 0.7;
  const timeLogged = Math.floor(Math.random() * 8);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
      aria-label={`Open task: ${task.title}`}
      className="w-full text-left bg-card border border-border rounded-lg p-3.5 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col gap-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      {!compact && task.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {task.tags.map(tag => (
          <span key={tag} className="px-1.5 py-px bg-muted text-muted-foreground rounded text-[10px]">
            {tag}
          </span>
        ))}
      </div>

      {!compact && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
          {subtaskCount > 0 && (
            <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{subtaskCount} subtasks</span>
          )}
          {hasDependent && (
            <span className="flex items-center gap-0.5"><GitBranch className="w-3 h-3" />dependency</span>
          )}
          {timeLogged > 0 && (
            <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" />{timeLogged}h logged</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/50">
        <div className="flex items-center gap-2">
          {task.assignedAgentName
            ? <AgentChip name={task.assignedAgentName} />
            : <span className="text-[10px] text-muted-foreground/50 italic">Unassigned</span>
          }
        </div>
        <div className="flex items-center gap-2.5 text-muted-foreground/60">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="w-3 h-3" />
              {task.commentCount}
            </span>
          )}
          <span className="text-[10px]">
            {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onAddTask, onTaskClick }: {
  column: typeof COLUMNS[number];
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className={cn("flex items-center gap-2 font-medium text-sm", column.color)}>
          {column.icon}
          {column.label}
          <span className="text-xs text-muted-foreground font-normal bg-muted rounded-full px-1.5 py-px">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(column.status)}
          aria-label={`Add task to ${column.label}`}
          data-testid={`add-task-${column.status}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-2.5">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="py-8 text-center text-muted-foreground/40 text-xs">No tasks</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {tasks.map((task) => {
        const col = COLUMNS.find(c => c.status === task.status)!;
        const subtaskCount = Math.floor(Math.random() * 5);
        return (
          <motion.button
            key={task.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onTaskClick(task)}
            data-testid={`task-list-row-${task.id}`}
            aria-label={`Open task: ${task.title}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left group w-full"
          >
            <span className={cn("shrink-0", col.color)}>{col.icon}</span>
            <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {task.title}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {subtaskCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                  <CheckSquare className="w-3 h-3" />{subtaskCount}
                </span>
              )}
              <PriorityBadge priority={task.priority} />
              {task.assignedAgentName
                ? <AgentChip name={task.assignedAgentName} />
                : <span className="text-[10px] text-muted-foreground/40 italic w-24">Unassigned</span>
              }
              <span className="text-[11px] text-muted-foreground/50 w-28 text-right hidden md:block">
                {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </motion.button>
        );
      })}
      {tasks.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No tasks in this project yet.</div>
      )}
    </div>
  );
}

// ── Timeline / Gantt View ─────────────────────────────────────────────────────

function TimelineView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 5 + i);
    return d;
  });

  const taskBars = tasks.map((task, i) => {
    const start = Math.floor(Math.random() * 10);
    const duration = 2 + Math.floor(Math.random() * 12);
    return { task, start, duration };
  });

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="flex gap-0 mb-2 ml-48">
          {days.map((d, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 text-center text-[10px] py-1 border-r border-border/30",
                isToday(d) ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {format(d, i === 0 || d.getDate() === 1 ? "MMM d" : "d")}
            </div>
          ))}
        </div>

        {/* Today line indicator */}
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-primary/60 z-10 pointer-events-none"
            style={{ left: `calc(192px + ${(5 / 30) * 100}%)` }}
          />
          {/* Rows */}
          {taskBars.map(({ task, start, duration }) => {
            const col = COLUMNS.find(c => c.status === task.status)!;
            return (
              <div key={task.id} className="flex items-center gap-0 h-10 border-b border-border/20 hover:bg-muted/20 group">
                <div className="w-48 shrink-0 px-3 flex items-center gap-2">
                  <span className={cn("shrink-0", col.color)}>{col.icon}</span>
                  <span className="text-xs text-foreground truncate">{task.title}</span>
                </div>
                <div className="flex-1 relative h-full flex items-center">
                  <div className="absolute inset-0 flex">
                    {days.map((_, i) => (
                      <div key={i} className={cn("flex-1 border-r border-border/20", isToday(days[i]) ? "bg-primary/5" : "")} />
                    ))}
                  </div>
                  <div
                    className={cn(
                      "absolute h-5 rounded flex items-center px-2 text-[10px] font-medium text-white z-10 cursor-pointer hover:opacity-90 transition-opacity",
                      task.priority === "critical" ? "bg-red-500" :
                      task.priority === "high" ? "bg-amber-500" :
                      task.priority === "medium" ? "bg-blue-500" : "bg-zinc-500"
                    )}
                    style={{
                      left: `${(start / 30) * 100}%`,
                      width: `${(duration / 30) * 100}%`,
                    }}
                    title={task.title}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {taskBars.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No tasks to display on timeline.</div>
        )}
      </div>
    </div>
  );
}

// ── Workload View ─────────────────────────────────────────────────────────────

function WorkloadView({ tasks }: { tasks: Task[] }) {
  const agentWorkloads = AGENT_OPTIONS.map(agent => {
    const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id);
    const hours = agentTasks.length * (2 + Math.floor(Math.random() * 6));
    const capacity = 40;
    return { ...agent, tasks: agentTasks, hours, capacity, pct: Math.min(100, Math.round((hours / capacity) * 100)) };
  }).filter(a => a.tasks.length > 0 || Math.random() > 0.5);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 mb-2 text-xs text-muted-foreground">
          <span className="font-medium">Team Member</span>
          <span className="col-span-2 font-medium">Weekly Allocation</span>
        </div>
        {workloadMembers(tasks).map(({ name, role, color, tasks: memberTasks, hours, pct }) => (
          <div key={name} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", color)}>
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{role} · {memberTasks} tasks</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-semibold tabular-nums", pct > 90 ? "text-red-400" : pct > 70 ? "text-amber-400" : "text-green-400")}>
                  {hours}h
                </p>
                <p className="text-[11px] text-muted-foreground">of 40h capacity</p>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct > 90 && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Over-allocated — consider reassigning tasks
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function workloadMembers(tasks: Task[]) {
  return TEAM_MEMBERS.map(m => {
    const count = Math.floor(Math.random() * 8);
    const hours = count * (3 + Math.floor(Math.random() * 4));
    return { ...m, tasks: count, hours, pct: Math.min(110, Math.round((hours / 40) * 100)) };
  });
}

// ── Table View ────────────────────────────────────────────────────────────────

function TableView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const cols = ["Title", "Status", "Priority", "Agent", "Tags", "Comments", "Updated"];
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {cols.map(c => (
              <th key={c} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const col = COLUMNS.find(c => c.status === task.status)!;
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 font-medium text-sm text-foreground group-hover:text-primary max-w-[260px] truncate">{task.title}</td>
                <td className="px-4 py-3">
                  <span className={cn("flex items-center gap-1.5", col.color)}>{col.icon} {col.label}</span>
                </td>
                <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                <td className="px-4 py-3">
                  {task.assignedAgentName ? <AgentChip name={task.assignedAgentName} /> : <span className="text-muted-foreground/40 italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">{task.tags.map(t => <span key={t} className="px-1.5 py-px bg-muted text-muted-foreground rounded">{t}</span>)}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{task.commentCount}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">No tasks found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: Task[] }) {
  const counts = {
    backlog: tasks.filter(t => t.status === "backlog").length,
    "in-progress": tasks.filter(t => t.status === "in-progress").length,
    "in-review": tasks.filter(t => t.status === "in-review").length,
    done: tasks.filter(t => t.status === "done").length,
  };
  const total = tasks.length;
  const donePercent = total > 0 ? Math.round((counts.done / total) * 100) : 0;
  const criticalCount = tasks.filter(t => t.priority === "critical" && t.status !== "done").length;

  return (
    <div className="flex items-center gap-6 px-6 py-2.5 border-b border-border bg-card/50 backdrop-blur shrink-0 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${donePercent}%` }} />
        </div>
        <span className="tabular-nums font-medium text-foreground">{donePercent}%</span>
        <span>complete</span>
      </div>
      <span className="text-border">|</span>
      {COLUMNS.map(col => (
        <span key={col.status} className={cn("flex items-center gap-1", col.color)}>
          {col.icon}
          <span className="font-medium text-foreground">{counts[col.status]}</span>
          <span className="text-muted-foreground/60">{col.label}</span>
        </span>
      ))}
      {criticalCount > 0 && (
        <>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">{criticalCount}</span> critical open
          </span>
        </>
      )}
    </div>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const col = COLUMNS.find(c => c.status === task.status)!;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const subtasks = ["Review requirements doc", "Set up dev environment", "Write unit tests", "Get design approval"];

  return (
    <DialogContent className="max-w-xl" aria-describedby="task-detail-desc">
      <DialogHeader>
        <DialogTitle className="text-base leading-snug pr-6">{task.title}</DialogTitle>
      </DialogHeader>
      <div id="task-detail-desc" className="flex flex-col gap-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>

        {/* Core attributes */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</span>
            <span className={cn("flex items-center gap-1.5 font-medium", col.color)}>{col.icon} {col.label}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Priority</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Assigned to</span>
            {task.assignedAgentName ? <AgentChip name={task.assignedAgentName} /> : <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Time logged</span>
            <span className="text-xs text-foreground flex items-center gap-1"><Timer className="w-3 h-3 text-muted-foreground" />3h 20m</span>
          </div>
        </div>

        {/* Subtasks */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Subtasks</span>
          <div className="flex flex-col gap-1.5">
            {subtasks.map((s, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!checkedItems[s]}
                  onChange={() => setCheckedItems(p => ({ ...p, [s]: !p[s] }))}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className={cn("text-xs transition-colors", checkedItems[s] ? "line-through text-muted-foreground/50" : "text-foreground")}>
                  {s}
                </span>
              </label>
            ))}
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(Object.values(checkedItems).filter(Boolean).length / subtasks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Integration links */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Linked resources</span>
          <div className="flex flex-wrap gap-1.5">
            <IntegrationPill icon={<Building2 className="w-3 h-3" />} label="Acme Co" color="text-blue-400 border-blue-500/20 bg-blue-500/5" />
            <IntegrationPill icon={<FileText className="w-3 h-3" />} label="SOW_v2.pdf" color="text-purple-400 border-purple-500/20 bg-purple-500/5" />
            <IntegrationPill icon={<DollarSign className="w-3 h-3" />} label="Invoice #1042" color="text-emerald-400 border-emerald-500/20 bg-emerald-500/5" />
            <IntegrationPill icon={<Mail className="w-3 h-3" />} label="3 emails" color="text-amber-400 border-amber-500/20 bg-amber-500/5" />
          </div>
        </div>

        {/* Dependencies */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Dependencies</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Blocked by: <span className="text-foreground font-medium">Design system audit</span></span>
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" className="flex items-center gap-1.5" aria-label="Ask AI to work on this task">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Ask AI to work on this
          </Button>
          <Button size="sm" variant="ghost" className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            Log time
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close task detail" className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────

function CreateTaskModal({ projectId, defaultStatus, onClose, onCreated }: {
  projectId: string;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [agentId, setAgentId] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    const agent = AGENT_OPTIONS.find(a => a.id === agentId);
    const task = await createTask({
      projectId, title: title.trim(), description: description.trim(),
      status, priority,
      assignedAgentId: agentId === "none" ? null : agentId,
      assignedAgentName: agent ? agent.name : null,
      tags: [],
    });
    setIsLoading(false);
    onCreated(task);
  };

  return (
    <DialogContent className="max-w-md" aria-describedby="create-task-desc">
      <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
      <form id="create-task-desc" onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium" htmlFor="task-title">Title</label>
          <Input id="task-title" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} autoFocus data-testid="input-task-title" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium" htmlFor="task-desc">Description</label>
          <Textarea id="task-desc" placeholder="Optional details..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="resize-none text-sm" data-testid="input-task-description" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Status</label>
            <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-task-status"><SelectValue /></SelectTrigger>
              <SelectContent>{COLUMNS.map(c => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Priority</label>
            <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-task-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">Assign to agent</label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="h-8 text-sm" data-testid="select-task-agent"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {AGENT_OPTIONS.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={!title.trim() || isLoading} data-testid="button-create-task">
            {isLoading ? "Creating..." : "Create Task"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Cancel task creation">Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
}

// ── My Work Section ───────────────────────────────────────────────────────────

function MyWorkSection({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const overdue = tasks.filter(t => t.status !== "done" && t.priority === "critical").slice(0, 3);
  const bucketedTasks: Record<string, Task[]> = {
    today: tasks.filter((_, i) => i % 3 === 0).slice(0, 4),
    next: tasks.filter((_, i) => i % 3 === 1).slice(0, 3),
    cleared: tasks.filter(t => t.status === "done").slice(0, 3),
  };

  return (
    <div className="flex-1 overflow-auto p-5">
      {overdue.length > 0 && (
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400 mb-1">Needs attention</p>
            <div className="flex flex-col gap-1">
              {overdue.map(t => (
                <button key={t.id} onClick={() => onTaskClick(t)} className="text-xs text-left text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                  <ArrowRight className="w-3 h-3 text-red-400" />
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {MY_WORK_BUCKETS.map(bucket => (
          <div key={bucket.id} className={cn("rounded-xl border p-4 flex flex-col gap-3", bucket.border, "bg-card/50")}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-semibold", bucket.color)}>{bucket.label}</h3>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", bucket.bg, bucket.color)}>
                {bucketedTasks[bucket.id]?.length ?? 0}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {(bucketedTasks[bucket.id] ?? []).map(task => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} compact />
              ))}
              {(bucketedTasks[bucket.id] ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground/40 py-4 text-center">Nothing here</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 bg-card border border-border rounded-xl">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Your week at a glance
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Tasks completed", value: "7", color: "text-green-400" },
            { label: "In progress", value: "4", color: "text-blue-400" },
            { label: "Overdue", value: "2", color: "text-red-400" },
            { label: "Hours logged", value: "23h", color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/40 rounded-lg p-3 text-center">
              <p className={cn("text-xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Triage Section ────────────────────────────────────────────────────────────

function TriageSection({ projects }: { projects: Project[] }) {
  const [converted, setConverted] = useState<Set<string>>(new Set());

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold">Team Inbox</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{TRIAGE_ITEMS.length - converted.size} items need attention</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" /> Auto-sort AI
            </Button>
          </div>
        </div>

        {TRIAGE_ITEMS.map(item => {
          const isConverted = converted.has(item.id);
          const suggestedProject = projects.find(p => p.id === item.suggested);
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: isConverted ? 0.5 : 1, y: 0 }}
              className={cn(
                "bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-opacity",
                isConverted && "border-green-500/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    item.type === "email" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    {item.type === "email" ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{item.subject}</p>
                      {item.client && (
                        <span className="text-[10px] px-1.5 py-px bg-blue-500/10 text-blue-400 rounded">{item.client}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.from} · {item.time}</p>
                  </div>
                </div>
                {isConverted ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" /> Converted
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => setConverted(prev => new Set([...prev, item.id]))}
                  >
                    <ArrowRight className="w-3 h-3" /> Convert to task
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-11">{item.preview}</p>
              {suggestedProject && !isConverted && (
                <div className="pl-11 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <p className="text-[10px] text-muted-foreground">
                    AI suggests: <span className="text-primary font-medium">{suggestedProject.name}</span>
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Templates Section ─────────────────────────────────────────────────────────

function TemplatesSection() {
  const categories = [...new Set(TEMPLATES.map(t => t.category))];
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all" ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold">Project Templates</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Reusable workflows for repeating work</p>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Template
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {["all", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tmpl => (
            <motion.div
              key={tmpl.id}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", tmpl.bg)}>
                  <span className={tmpl.color}>{tmpl.icon}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tmpl.tasks} tasks</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{tmpl.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {tmpl.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-px bg-muted text-muted-foreground rounded">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">Use template</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2">Preview</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Work Calendar Section ─────────────────────────────────────────────────────

function WorkCalendarSection({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const prefixDays = Array.from({ length: startDayOfWeek });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Assign tasks to random days in the month for display
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task, i) => {
      const dayIndex = i % days.length;
      const key = format(days[dayIndex], "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks, days]);

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {prefixDays.map((_, i) => (
            <div key={`prefix-${i}`} className="bg-muted/20 min-h-[80px] p-1.5" />
          ))}
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay[key] ?? [];
            const today = isToday(day);
            return (
              <div key={key} className={cn("bg-card min-h-[80px] p-1.5 flex flex-col gap-1", today && "bg-primary/5")}>
                <span className={cn(
                  "text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full",
                  today ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </span>
                {dayTasks.slice(0, 2).map(t => (
                  <div key={t.id} className={cn(
                    "text-[10px] px-1.5 py-px rounded truncate font-medium",
                    t.priority === "critical" ? "bg-red-500/20 text-red-400" :
                    t.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <span className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 2} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── AI Assistant Panel ────────────────────────────────────────────────────────

function AIAssistantPanel({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "I can help you create projects, summarize tasks, detect risks, or generate a project plan from a brief. What do you need?" }
  ]);
  const suggestions = [
    "Summarize all overdue tasks",
    "Create onboarding project for Acme Co",
    "What tasks are at risk of delay?",
    "Generate a plan from last email",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "Processing your request... I've identified 3 related tasks and suggested assignments based on current workload. Would you like me to create the project structure now?" }
    ]);
    setInput("");
  };

  return (
    <div className="w-72 border-l bg-card flex flex-col shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Assistant
        </h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close AI panel">
          <PanelRightClose className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-[10px] px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask AI anything..."
            className="h-8 text-xs"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} aria-label="Send message">
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function WorkPage() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-1");
  const { data: allTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const queryClient = useQueryClient();

  const [section, setSection] = useState<WorkSection>("projects");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectsPanelOpen, setProjectsPanelOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [createModal, setCreateModal] = useState<{ open: boolean; status: TaskStatus }>({ open: false, status: "backlog" });

  const projectTasks = allTasks.filter(t => t.projectId === selectedProjectId);
  const filteredTasks = projectTasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleTaskCreated = (newTask: Task) => {
    queryClient.setQueryData(["tasks"], (old: Task[] | undefined) => old ? [...old, newTask] : [newTask]);
    setCreateModal({ open: false, status: "backlog" });
  };

  const NAV_SECTIONS = [
    { id: "mywork" as WorkSection,   label: "My Work",   icon: <User className="w-3.5 h-3.5" />        },
    { id: "triage" as WorkSection,   label: "Triage",    icon: <Inbox className="w-3.5 h-3.5" />       },
    { id: "projects" as WorkSection, label: "Projects",  icon: <FolderKanban className="w-3.5 h-3.5" />},
    { id: "templates" as WorkSection,label: "Templates", icon: <LayoutTemplate className="w-3.5 h-3.5" />},
    { id: "calendar" as WorkSection, label: "Calendar",  icon: <CalendarDays className="w-3.5 h-3.5" />},
  ];

  const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "board",    label: "Board",    icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "list",     label: "List",     icon: <List className="w-3.5 h-3.5" />       },
    { id: "timeline", label: "Timeline", icon: <AlignLeft className="w-3.5 h-3.5" />  },
    { id: "workload", label: "Workload", icon: <Users className="w-3.5 h-3.5" />      },
    { id: "table",    label: "Table",    icon: <Table2 className="w-3.5 h-3.5" />     },
  ];

  return (
    <div className="flex h-full bg-background overflow-hidden flex-col" data-testid="work-page">
      {/* ── Top navigation ── */}
      <div className="border-b bg-card/60 backdrop-blur-sm shrink-0 flex items-center gap-0 px-4">
        {NAV_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
              section === s.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s.icon}
            {s.label}
            {s.id === "triage" && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
                {TRIAGE_ITEMS.length}
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 py-2">
          <button
            onClick={() => setAiPanelOpen(p => !p)}
            className={cn(
              "h-7 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors",
              aiPanelOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Projects section has its own sub-header */}
          {section === "projects" && (
            <>
              <div className="px-5 py-3 border-b bg-card/40 flex items-center gap-4 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("w-3 h-3 rounded-sm shrink-0", PROJECT_COLORS[selectedProjectId] ?? "bg-zinc-500")} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{selectedProject?.name ?? "Select a project"}</h3>
                    {selectedProject && (
                      <p className="text-[11px] text-muted-foreground truncate">{selectedProject.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="search" placeholder="Search tasks..." value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-8 pl-8 pr-3 bg-muted border border-border rounded-md text-xs w-36 focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Search tasks" data-testid="input-search-tasks"
                    />
                  </div>

                  {/* Priority filter */}
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-8 w-32 text-xs" data-testid="select-filter-priority">
                      <Filter className="w-3 h-3 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View toggle */}
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    {VIEW_MODES.map(vm => (
                      <button
                        key={vm.id}
                        onClick={() => setViewMode(vm.id)}
                        aria-label={`${vm.label} view`}
                        title={vm.label}
                        data-testid={`button-view-${vm.id}`}
                        className={cn(
                          "h-8 px-2.5 flex items-center transition-colors",
                          viewMode === vm.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {vm.icon}
                      </button>
                    ))}
                  </div>

                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setCreateModal({ open: true, status: "backlog" })} aria-label="Add new task" data-testid="button-add-task">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </Button>

                  <button
                    onClick={() => setProjectsPanelOpen(p => !p)}
                    aria-label={projectsPanelOpen ? "Collapse projects panel" : "Expand projects panel"}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    {projectsPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <StatsBar tasks={filteredTasks} />
            </>
          )}

          {/* Section content */}
          {section === "mywork" && <MyWorkSection tasks={allTasks} onTaskClick={setSelectedTask} />}
          {section === "triage" && <TriageSection projects={projects} />}
          {section === "templates" && <TemplatesSection />}
          {section === "calendar" && <WorkCalendarSection tasks={allTasks} />}

          {section === "projects" && (
            <>
              {viewMode === "board" && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
                  <div className="flex gap-4 h-full min-w-max">
                    {COLUMNS.map(col => (
                      <KanbanColumn
                        key={col.status}
                        column={col}
                        tasks={filteredTasks.filter(t => t.status === col.status)}
                        onAddTask={(status) => setCreateModal({ open: true, status })}
                        onTaskClick={setSelectedTask}
                      />
                    ))}
                  </div>
                </div>
              )}
              {viewMode === "list" && (
                <ScrollArea className="flex-1">
                  <div className="bg-card/30">
                    <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border/50 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      <span className="w-4 shrink-0" />
                      <span className="flex-1">Task</span>
                      <span className="w-20 text-right shrink-0">Priority</span>
                      <span className="w-32 text-right shrink-0">Agent</span>
                      <span className="w-28 text-right shrink-0 hidden md:block">Updated</span>
                    </div>
                    <ListView tasks={filteredTasks} onTaskClick={setSelectedTask} />
                  </div>
                </ScrollArea>
              )}
              {viewMode === "timeline" && <TimelineView tasks={filteredTasks} />}
              {viewMode === "workload" && <WorkloadView tasks={filteredTasks} />}
              {viewMode === "table" && <TableView tasks={filteredTasks} onTaskClick={setSelectedTask} />}
            </>
          )}
        </div>

        {/* ── Projects sidebar (only for projects section) ── */}
        {section === "projects" && (
          <div className={cn(
            "border-l bg-card flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
            projectsPanelOpen ? "w-56" : "w-0"
          )}>
            <div className="p-4 border-b flex items-center justify-between min-w-[224px]">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Projects
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="New project" data-testid="button-new-project">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 min-w-[224px]">
              <div className="p-2 flex flex-col gap-0.5">
                {projects.map(p => {
                  const isActive = p.id === selectedProjectId;
                  const pTasks = allTasks.filter(t => t.projectId === p.id);
                  const donePct = pTasks.length ? Math.round((pTasks.filter(t => t.status === "done").length / pTasks.length) * 100) : 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      data-testid={`project-item-${p.id}`}
                      aria-label={`Select project ${p.name}`}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", PROJECT_DOT_COLORS[p.id] ?? "bg-zinc-500")} />
                        <span className="text-[13px] font-medium truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-4">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500/70 rounded-full transition-all" style={{ width: `${donePct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">{donePct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-3 border-t min-w-[224px]">
              <div className="text-[11px] text-muted-foreground/60 text-center">
                {projects.length} projects · {allTasks.length} tasks total
              </div>
            </div>
          </div>
        )}

        {/* ── AI Assistant panel ── */}
        {aiPanelOpen && <AIAssistantPanel onClose={() => setAiPanelOpen(false)} />}
      </div>

      {/* ── Task detail modal ── */}
      <Dialog open={!!selectedTask} onOpenChange={open => { if (!open) setSelectedTask(null); }}>
        {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
      </Dialog>

      {/* ── Create task modal ── */}
      <Dialog open={createModal.open} onOpenChange={open => { if (!open) setCreateModal(p => ({ ...p, open: false })); }}>
        {createModal.open && selectedProjectId && (
          <CreateTaskModal
            projectId={selectedProjectId}
            defaultStatus={createModal.status}
            onClose={() => setCreateModal(p => ({ ...p, open: false }))}
            onCreated={handleTaskCreated}
          />
        )}
      </Dialog>
    </div>
  );
}
