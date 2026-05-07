import { useState } from "react";
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
  Plus, FolderKanban, Bot, MessageSquare, ChevronRight,
  Circle, Clock, Eye, CheckCircle2, AlertTriangle, Flag,
  LayoutGrid, List, Search, Filter, Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: "backlog",     label: "Backlog",     icon: <Circle className="w-3.5 h-3.5" />,      color: "text-zinc-400" },
  { status: "in-progress", label: "In Progress", icon: <Clock className="w-3.5 h-3.5" />,       color: "text-blue-400" },
  { status: "in-review",   label: "In Review",   icon: <Eye className="w-3.5 h-3.5" />,         color: "text-purple-400" },
  { status: "done",        label: "Done",        icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-green-400" },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  low:      { label: "Low",      color: "text-zinc-400",   bg: "bg-zinc-500/10",   dot: "bg-zinc-400" },
  medium:   { label: "Medium",   color: "text-blue-400",   bg: "bg-blue-500/10",   dot: "bg-blue-400" },
  high:     { label: "High",     color: "text-amber-400",  bg: "bg-amber-500/10",  dot: "bg-amber-400" },
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/10",    dot: "bg-red-500" },
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

// ── Sub-components ────────────────────────────────────────────────────────────

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

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
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

      {task.description && (
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

function KanbanColumn({
  column, tasks, onAddTask, onTaskClick,
}: {
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
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
            <div className="py-8 text-center text-muted-foreground/40 text-xs">
              No tasks
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ListView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {tasks.map((task) => {
        const col = COLUMNS.find(c => c.status === task.status)!;
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
        <div className="py-16 text-center text-muted-foreground text-sm">
          No tasks in this project yet.
        </div>
      )}
    </div>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const col = COLUMNS.find(c => c.status === task.status)!;
  return (
    <DialogContent className="max-w-lg" aria-describedby="task-detail-desc">
      <DialogHeader>
        <DialogTitle className="text-base leading-snug pr-6">{task.title}</DialogTitle>
      </DialogHeader>
      <div id="task-detail-desc" className="flex flex-col gap-4 mt-2">
        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</span>
            <span className={cn("flex items-center gap-1.5 font-medium", col.color)}>
              {col.icon} {col.label}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Priority</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Assigned to</span>
            {task.assignedAgentName
              ? <AgentChip name={task.assignedAgentName} />
              : <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>
            }
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Last updated</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
            </span>
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
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5"
            aria-label="Ask AI to work on this task"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Ask AI to work on this
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close task detail">
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────

function CreateTaskModal({
  projectId,
  defaultStatus,
  onClose,
  onCreated,
}: {
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
      projectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedAgentId: agentId === "none" ? null : agentId,
      assignedAgentName: agent ? agent.name : null,
      tags: [],
    });
    setIsLoading(false);
    onCreated(task);
  };

  return (
    <DialogContent className="max-w-md" aria-describedby="create-task-desc">
      <DialogHeader>
        <DialogTitle>New Task</DialogTitle>
      </DialogHeader>
      <form id="create-task-desc" onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium" htmlFor="task-title">Title</label>
          <Input
            id="task-title"
            placeholder="What needs to be done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            data-testid="input-task-title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium" htmlFor="task-desc">Description</label>
          <Textarea
            id="task-desc"
            placeholder="Optional details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            data-testid="input-task-description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Status</label>
            <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map(c => (
                  <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Priority</label>
            <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-task-priority">
                <SelectValue />
              </SelectTrigger>
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
            <SelectTrigger className="h-8 text-sm" data-testid="select-task-agent">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {AGENT_OPTIONS.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={!title.trim() || isLoading} data-testid="button-create-task">
            {isLoading ? "Creating..." : "Create Task"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Cancel task creation">
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
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
    <div className="flex items-center gap-6 px-6 py-3 border-b border-border bg-card/50 backdrop-blur shrink-0 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${donePercent}%` }}
          />
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export function WorkPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-1");

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createModal, setCreateModal] = useState<{ open: boolean; status: TaskStatus }>({
    open: false,
    status: "backlog",
  });

  const projectTasks = allTasks.filter(t => t.projectId === selectedProjectId);
  const filteredTasks = projectTasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleTaskCreated = (newTask: Task) => {
    queryClient.setQueryData(["tasks"], (old: Task[] | undefined) =>
      old ? [...old, newTask] : [newTask]
    );
    setCreateModal({ open: false, status: "backlog" });
  };

  return (
    <div className="flex h-full bg-background overflow-hidden" data-testid="work-page">
      {/* ── Project sidebar ── */}
      <div className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Projects
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="New project"
            data-testid="button-new-project"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-0.5">
            {projects.map(p => {
              const isActive = p.id === selectedProjectId;
              const pTasks = allTasks.filter(t => t.projectId === p.id);
              const donePct = pTasks.length
                ? Math.round((pTasks.filter(t => t.status === "done").length / pTasks.length) * 100)
                : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  data-testid={`project-item-${p.id}`}
                  aria-label={`Select project ${p.name}`}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", PROJECT_COLORS[p.id] ?? "bg-zinc-500")} />
                    <span className="text-[13px] font-medium truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500/70 rounded-full transition-all"
                        style={{ width: `${donePct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">{donePct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <div className="text-[11px] text-muted-foreground/60 text-center">
            {projects.length} projects · {allTasks.length} tasks total
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-card/60 backdrop-blur-sm flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("w-3 h-3 rounded-sm shrink-0", PROJECT_COLORS[selectedProjectId] ?? "bg-zinc-500")} />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {selectedProject?.name ?? "Select a project"}
              </h3>
              {selectedProject && (
                <p className="text-[11px] text-muted-foreground truncate">{selectedProject.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 bg-muted border border-border rounded-md text-xs w-40 focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Search tasks"
                data-testid="input-search-tasks"
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
              <button
                onClick={() => setViewMode("board")}
                aria-label="Board view"
                data-testid="button-view-board"
                className={cn(
                  "h-8 px-2.5 flex items-center transition-colors",
                  viewMode === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="List view"
                data-testid="button-view-list"
                className={cn(
                  "h-8 px-2.5 flex items-center transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setCreateModal({ open: true, status: "backlog" })}
              aria-label="Add new task"
              data-testid="button-add-task"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <StatsBar tasks={filteredTasks} />

        {/* Board / List */}
        {viewMode === "board" ? (
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
        ) : (
          <ScrollArea className="flex-1">
            <div className="bg-card/30">
              {/* List header */}
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
      </div>

      {/* ── Task detail modal ── */}
      <Dialog open={!!selectedTask} onOpenChange={open => { if (!open) setSelectedTask(null); }}>
        {selectedTask && (
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
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
