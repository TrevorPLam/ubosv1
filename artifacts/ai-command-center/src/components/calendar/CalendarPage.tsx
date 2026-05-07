import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, type Task, type TaskStatus, type TaskPriority } from "@/api/projects";
import { useCalendarStore, type Appointment, type AppointmentType } from "@/stores/calendarStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin, Video,
  Bot, CalendarDays, LayoutGrid, List, X, Trash2, Sparkles,
  CheckCircle2, Circle, Eye, AlertTriangle, Flag, Phone,
  MonitorPlay, Mic, Bell, Share2, Copy, CheckCheck, Calendar,
  ArrowRight, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  parseISO, differenceInMinutes, getHours, getMinutes,
  isBefore, isAfter, parse,
} from "date-fns";

// ── Task due-date map (virtual schedule for demo) ─────────────────────────────

function buildTaskDueDates(): Record<string, string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = (day: number) => `${y}-${m}-${String(day).padStart(2, "0")}`;
  return {
    "task-1": d(5),  "task-2": d(8),  "task-3": d(12), "task-4": d(15),
    "task-5": d(20), "task-6": d(22), "task-7": d(28), "task-8": d(3),
    "task-9": d(10), "task-10": d(14),"task-11": d(18),"task-12": d(26),
    "task-13": d(7), "task-14": d(11),"task-15": d(19),"task-16": d(30),
  };
}

const TASK_DUE_DATES = buildTaskDueDates();

// ── Color configs ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TaskPriority, { chip: string; dot: string; label: string }> = {
  low:      { chip: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",    dot: "bg-zinc-400",   label: "Low" },
  medium:   { chip: "bg-blue-500/20 text-blue-300 border-blue-500/30",    dot: "bg-blue-400",   label: "Medium" },
  high:     { chip: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400",  label: "High" },
  critical: { chip: "bg-red-500/20 text-red-300 border-red-500/30",       dot: "bg-red-500",    label: "Critical" },
};

const APT_COLORS: Record<string, { chip: string; dot: string }> = {
  blue:   { chip: "bg-blue-500/20 text-blue-300 border-blue-500/30",       dot: "bg-blue-400" },
  purple: { chip: "bg-purple-500/20 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
  red:    { chip: "bg-red-500/20 text-red-300 border-red-500/30",          dot: "bg-red-500" },
  indigo: { chip: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400" },
  teal:   { chip: "bg-teal-500/20 text-teal-300 border-teal-500/30",       dot: "bg-teal-400" },
  pink:   { chip: "bg-pink-500/20 text-pink-300 border-pink-500/30",       dot: "bg-pink-400" },
  orange: { chip: "bg-orange-500/20 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
};

const APT_TYPE_META: Record<AppointmentType, { label: string; icon: React.ReactNode; defaultColor: string }> = {
  meeting:   { label: "Meeting",   icon: <Users className="w-3 h-3" />,      defaultColor: "purple" },
  call:      { label: "Call",      icon: <Phone className="w-3 h-3" />,      defaultColor: "teal" },
  demo:      { label: "Demo",      icon: <MonitorPlay className="w-3 h-3" />, defaultColor: "indigo" },
  interview: { label: "Interview", icon: <Mic className="w-3 h-3" />,        defaultColor: "pink" },
  reminder:  { label: "Reminder",  icon: <Bell className="w-3 h-3" />,       defaultColor: "orange" },
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  backlog:      <Circle className="w-3 h-3 text-zinc-400" />,
  "in-progress":<Clock className="w-3 h-3 text-blue-400" />,
  "in-review":  <Eye className="w-3 h-3 text-purple-400" />,
  done:         <CheckCircle2 className="w-3 h-3 text-green-400" />,
};

// ── Unified CalendarEvent type ────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  kind: "task" | "appointment";
  chipClass: string;
  dotClass: string;
  taskRef?: Task;
  aptRef?: Appointment;
}

function taskToEvent(task: Task, dueDate: string): CalEvent {
  const p = PRIORITY_COLORS[task.priority];
  return {
    id: task.id,
    title: task.title,
    date: dueDate,
    allDay: true,
    kind: "task",
    chipClass: p.chip,
    dotClass: p.dot,
    taskRef: task,
  };
}

function aptToEvent(apt: Appointment): CalEvent {
  const c = APT_COLORS[apt.color] ?? APT_COLORS.blue;
  return {
    id: apt.id,
    title: apt.title,
    date: apt.date,
    startTime: apt.allDay ? undefined : apt.startTime,
    endTime: apt.allDay ? undefined : apt.endTime,
    allDay: apt.allDay,
    kind: "appointment",
    chipClass: c.chip,
    dotClass: c.dot,
    aptRef: apt,
  };
}

// ── View mode ─────────────────────────────────────────────────────────────────

type ViewMode = "month" | "week" | "day" | "agenda";

// ── MiniCalendar ──────────────────────────────────────────────────────────────

function MiniCalendar({
  current, selected, onSelect, onNavigate,
}: {
  current: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  onNavigate: (d: Date) => void;
}) {
  const [mini, setMini] = useState(current);

  useEffect(() => { setMini(current); }, [current]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(mini));
    const end = endOfWeek(endOfMonth(mini));
    return eachDayOfInterval({ start, end });
  }, [mini]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{format(mini, "MMMM yyyy")}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setMini(subMonths(mini, 1))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMini(addMonths(mini, 1))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-medium text-muted-foreground/60 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, mini);
          const isSel = isSameDay(day, selected);
          const isTod = isToday(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => { onSelect(day); onNavigate(day); }}
              className={cn(
                "text-[10px] h-6 w-full rounded flex items-center justify-center transition-colors",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isSel && !isTod && "hover:bg-muted text-muted-foreground hover:text-foreground",
                isTod && !isSel && "text-primary font-bold",
                isSel && "bg-primary text-primary-foreground font-bold",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Event chip (month/agenda) ─────────────────────────────────────────────────

function EventChip({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-1 truncate transition-opacity hover:opacity-80",
        ev.chipClass,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ev.dotClass)} />
      <span className="truncate">{ev.title}</span>
    </button>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({
  currentDate, events, selectedDate, onDayClick, onEventClick, onCreateAtDate,
}: {
  currentDate: Date;
  events: CalEvent[];
  selectedDate: Date;
  onDayClick: (d: Date) => void;
  onEventClick: (ev: CalEvent) => void;
  onCreateAtDate: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach((ev) => {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-card/50">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)] divide-x divide-y divide-border/50 min-h-full">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[key] ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSel = isSameDay(day, selectedDate);
            const isTod = isToday(day);
            const visible = dayEvents.slice(0, 3);
            const hidden = dayEvents.length - visible.length;

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={cn(
                  "p-1.5 flex flex-col gap-0.5 cursor-pointer transition-colors",
                  !isCurrentMonth && "bg-muted/20",
                  isCurrentMonth && "bg-background hover:bg-muted/30",
                  isSel && "ring-1 ring-inset ring-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      !isCurrentMonth && "text-muted-foreground/40",
                      isCurrentMonth && !isTod && "text-foreground",
                      isTod && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateAtDate(day); }}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 w-4 h-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {visible.map((ev) => (
                    <EventChip key={ev.id} ev={ev} onClick={() => onEventClick(ev)} />
                  ))}
                  {hidden > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDayClick(day); }}
                      className="text-[9px] text-muted-foreground hover:text-foreground px-1.5"
                    >
                      +{hidden} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 22;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function WeekView({
  currentDate, events, onEventClick, onCreateAtDateTime,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
  onCreateAtDateTime: (d: Date, time: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const start = startOfWeek(currentDate);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, []);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const allDayEvents = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    days.forEach(d => {
      const key = format(d, "yyyy-MM-dd");
      map[key] = events.filter(e => e.date === key && e.allDay);
    });
    return map;
  }, [days, events]);

  const timedEvents = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    days.forEach(d => {
      const key = format(d, "yyyy-MM-dd");
      map[key] = events.filter(e => e.date === key && !e.allDay && e.startTime);
    });
    return map;
  }, [days, events]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-border bg-card/50 shrink-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-border/50" />
        {days.map((day) => (
          <div key={day.toISOString()} className={cn(
            "text-center py-2 border-r border-border/50 last:border-r-0",
          )}>
            <div className="text-[10px] font-medium text-muted-foreground uppercase">{format(day, "EEE")}</div>
            <div className={cn(
              "text-sm font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full",
              isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground",
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      <div className="grid border-b border-border bg-muted/10 shrink-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-border/50 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/50 rotate-[-90deg] whitespace-nowrap">All day</span>
        </div>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const apts = allDayEvents[key] ?? [];
          return (
            <div key={day.toISOString()} className="border-r border-border/50 last:border-r-0 p-1 min-h-[28px] flex flex-col gap-0.5">
              {apts.map(ev => (
                <EventChip key={ev.id} ev={ev} onClick={() => onEventClick(ev)} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          {/* Hours column */}
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 flex items-start justify-end pr-2"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT, width: 56 }}
            >
              <span className="text-[9px] text-muted-foreground/50 mt-[-6px]">
                {format(new Date(2000, 0, 1, h), "h a")}
              </span>
            </div>
          ))}

          {/* Grid lines + columns */}
          <div
            className="ml-14 grid relative"
            style={{ gridTemplateColumns: "repeat(7, 1fr)", height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
          >
            {/* Horizontal hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/30"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              />
            ))}
            {/* Half-hour dashed lines */}
            {hours.map((h) => (
              <div
                key={`half-${h}`}
                className="absolute left-0 right-0 border-t border-border/10 border-dashed"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Current time indicator */}
            {(() => {
              const now = new Date();
              if (days.some(d => isSameDay(d, now))) {
                const dayIdx = days.findIndex(d => isSameDay(d, now));
                const totalMins = getHours(now) * 60 + getMinutes(now);
                const top = ((totalMins / 60) - START_HOUR) * HOUR_HEIGHT;
                if (top >= 0 && top <= (END_HOUR - START_HOUR) * HOUR_HEIGHT) {
                  const colW = 100 / 7;
                  return (
                    <div
                      className="absolute z-20 pointer-events-none flex items-center"
                      style={{ top, left: `${dayIdx * colW}%`, width: `${colW}%` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 -ml-1" />
                      <div className="flex-1 h-[1.5px] bg-primary" />
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvs = timedEvents[key] ?? [];
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative border-r border-border/30 last:border-r-0",
                    isToday(day) && "bg-primary/3",
                  )}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relY = e.clientY - rect.top;
                    const hour = Math.floor(relY / HOUR_HEIGHT) + START_HOUR;
                    const min = Math.floor((relY % HOUR_HEIGHT) / HOUR_HEIGHT * 4) * 15;
                    const time = `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
                    onCreateAtDateTime(day, time);
                  }}
                >
                  {dayEvs.map((ev) => {
                    const startMins = timeToMinutes(ev.startTime!) - START_HOUR * 60;
                    const endMins = ev.endTime
                      ? timeToMinutes(ev.endTime) - START_HOUR * 60
                      : startMins + 60;
                    const top = (startMins / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 20);
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        className={cn(
                          "absolute inset-x-0.5 rounded px-1.5 py-1 text-left border overflow-hidden hover:opacity-90 transition-opacity z-10",
                          ev.chipClass,
                        )}
                        style={{ top, height }}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate">{ev.title}</p>
                        {height > 28 && ev.startTime && (
                          <p className="text-[9px] opacity-70">{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  currentDate, events, onEventClick, onCreateAtDateTime,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
  onCreateAtDateTime: (d: Date, time: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const key = format(currentDate, "yyyy-MM-dd");
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
  }, []);

  const allDayEvs = events.filter(e => e.date === key && e.allDay);
  const timedEvs = events.filter(e => e.date === key && !e.allDay && e.startTime);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-3 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className={cn(
            "text-3xl font-bold",
            isToday(currentDate) ? "text-primary" : "text-foreground",
          )}>
            {format(currentDate, "d")}
          </span>
          <span className="text-lg font-medium text-muted-foreground">{format(currentDate, "EEEE, MMMM yyyy")}</span>
          {isToday(currentDate) && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Today</span>
          )}
        </div>
        {allDayEvs.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {allDayEvs.map(ev => <EventChip key={ev.id} ev={ev} onClick={() => onEventClick(ev)} />)}
          </div>
        )}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative ml-16" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
          {/* Hour lines */}
          {hours.map((h) => (
            <div key={h}>
              <div
                className="absolute left-0 right-0 border-t border-border/30"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              />
              <div
                className="absolute -left-16 text-right pr-3 flex items-start"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT, width: 64, height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-muted-foreground/60 -mt-2">{format(new Date(2000,0,1,h), "h a")}</span>
              </div>
            </div>
          ))}

          {/* Current time */}
          {isToday(currentDate) && (() => {
            const now = new Date();
            const top = ((getHours(now) + getMinutes(now)/60) - START_HOUR) * HOUR_HEIGHT;
            return top >= 0 && top <= (END_HOUR - START_HOUR) * HOUR_HEIGHT ? (
              <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top }}>
                <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1.5 shrink-0" />
                <div className="flex-1 h-[2px] bg-primary" />
              </div>
            ) : null;
          })()}

          {/* Click to create */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relY = e.clientY - rect.top;
              const hour = Math.floor(relY / HOUR_HEIGHT) + START_HOUR;
              const min = Math.floor((relY % HOUR_HEIGHT) / HOUR_HEIGHT * 4) * 15;
              onCreateAtDateTime(currentDate, `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`);
            }}
          />

          {/* Events */}
          {timedEvs.map((ev) => {
            const startMins = timeToMinutes(ev.startTime!) - START_HOUR * 60;
            const endMins = ev.endTime ? timeToMinutes(ev.endTime) - START_HOUR * 60 : startMins + 60;
            const top = (startMins / 60) * HOUR_HEIGHT;
            const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 24);
            return (
              <button
                key={ev.id}
                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                className={cn(
                  "absolute left-1 right-2 rounded-lg px-3 py-2 text-left border z-10 hover:opacity-90 transition-opacity",
                  ev.chipClass,
                )}
                style={{ top, height }}
              >
                <p className="text-xs font-semibold truncate">{ev.title}</p>
                {height > 32 && (
                  <p className="text-[10px] opacity-70">{ev.startTime} – {ev.endTime}</p>
                )}
                {height > 52 && ev.aptRef && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] opacity-60">
                    {ev.aptRef.attendees.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {ev.aptRef.attendees.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Agenda View ───────────────────────────────────────────────────────────────

function AgendaView({
  currentDate, events, onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
}) {
  const upcoming = useMemo(() => {
    const start = startOfWeek(currentDate);
    const days: { date: Date; evs: CalEvent[] }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      const key = format(d, "yyyy-MM-dd");
      const evs = events.filter(e => e.date === key).sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00");
      });
      if (evs.length > 0) days.push({ date: d, evs });
    }
    return days;
  }, [currentDate, events]);

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 flex flex-col gap-6">
        {upcoming.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No events in the next 30 days.</div>
        )}
        {upcoming.map(({ date, evs }) => (
          <div key={date.toISOString()}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0",
                isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}>
                <span className="text-[10px] font-medium">{format(date, "EEE")}</span>
                <span className="text-sm font-bold leading-none">{format(date, "d")}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{format(date, "MMMM yyyy")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex flex-col gap-1.5 ml-13" style={{ marginLeft: 52 }}>
              {evs.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left hover:opacity-80 transition-opacity",
                    ev.chipClass,
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", ev.dotClass)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    {!ev.allDay && ev.startTime && (
                      <p className="text-[10px] opacity-70">{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</p>
                    )}
                    {ev.allDay && <p className="text-[10px] opacity-60">All day {ev.kind === "task" ? "· Task" : "· Appointment"}</p>}
                  </div>
                  {ev.kind === "task" && ev.taskRef && (
                    <div className="flex items-center gap-1 shrink-0">
                      {STATUS_ICONS[ev.taskRef.status]}
                    </div>
                  )}
                  {ev.kind === "appointment" && ev.aptRef && (
                    <div className="shrink-0 text-[10px] opacity-60">
                      {APT_TYPE_META[ev.aptRef.type].label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ── Create/Edit Appointment Modal ─────────────────────────────────────────────

const APT_COLORS_LIST = ["blue","purple","red","indigo","teal","pink","orange"] as const;

function AppointmentModal({
  initial, defaultDate, defaultTime, onClose,
}: {
  initial?: Appointment;
  defaultDate?: Date;
  defaultTime?: string;
  onClose: () => void;
}) {
  const { add, update } = useCalendarStore();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<AppointmentType>(initial?.type ?? "meeting");
  const [date, setDate] = useState(initial?.date ?? (defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")));
  const [startTime, setStartTime] = useState(initial?.startTime ?? defaultTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [attendeesRaw, setAttendeesRaw] = useState(initial?.attendees.join(", ") ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [videoLink, setVideoLink] = useState(initial?.videoLink ?? "");
  const [color, setColor] = useState(initial?.color ?? "blue");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    const apt = {
      title: title.trim(), type, date, startTime, endTime, allDay,
      description: description.trim(),
      attendees: attendeesRaw.split(",").map(s => s.trim()).filter(Boolean),
      location: location.trim(), videoLink: videoLink.trim(), color,
    };
    if (isEdit) update(initial!.id, apt);
    else add(apt);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://book.example.com/${title.toLowerCase().replace(/\s+/g,"-")}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="apt-modal-desc">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Appointment" : "New Appointment"}</DialogTitle>
      </DialogHeader>
      <div id="apt-modal-desc" className="flex flex-col gap-3 mt-1">
        {/* Title */}
        <Input
          placeholder="Appointment title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          className="text-sm"
        />

        {/* Type + Color */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Type</label>
            <Select value={type} onValueChange={v => setType(v as AppointmentType)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(APT_TYPE_META) as [AppointmentType, typeof APT_TYPE_META[AppointmentType]][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <span className="flex items-center gap-1.5">{v.icon} {v.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Color</label>
            <div className="flex gap-1.5 mt-1">
              {APT_COLORS_LIST.map(c => {
                const cfg = APT_COLORS[c];
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn("w-5 h-5 rounded-full border-2 transition-all", cfg.dot,
                      color === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Date + All-day */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
            <span className="text-xs text-muted-foreground">All day</span>
          </label>
        </div>

        {/* Times */}
        {!allDay && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Start</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground mb-1 block font-medium">End</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Attendees</label>
          <Input
            placeholder="Alice, Bob, carol@example.com"
            value={attendeesRaw}
            onChange={e => setAttendeesRaw(e.target.value)}
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Comma-separated names or emails</p>
        </div>

        {/* Location */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Location</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              <Input
                placeholder="Room / address"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="h-8 text-sm pl-7"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Video link</label>
            <div className="relative">
              <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              <Input
                placeholder="https://meet.example.com/…"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                className="h-8 text-sm pl-7"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Description</label>
          <Textarea
            placeholder="Notes, agenda, instructions…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        {/* Calendly-style share */}
        {!isEdit && (
          <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
            <Share2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              book.example.com/{title ? title.toLowerCase().replace(/\s+/g,"-") : "your-meeting"}
            </span>
            <button
              onClick={handleCopyLink}
              className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1"
            >
              {linkCopied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {linkCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border">
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
            {isEdit ? "Save Changes" : "Create Appointment"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Task Detail Modal (from calendar) ─────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "done", label: "Done" },
];

function TaskEventModal({ task, dueDate, onClose }: { task: Task; dueDate: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const p = PRIORITY_COLORS[task.priority];

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    queryClient.setQueryData(["tasks"], (old: Task[] | undefined) =>
      old ? old.map(t => t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t) : old
    );
  };

  return (
    <DialogContent className="max-w-md" aria-describedby="task-cal-desc">
      <DialogHeader>
        <DialogTitle className="text-sm leading-snug pr-6">{task.title}</DialogTitle>
      </DialogHeader>
      <div id="task-cal-desc" className="flex flex-col gap-3 mt-1">
        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
            <Select value={status} onValueChange={v => handleStatusChange(v as TaskStatus)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Priority</span>
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium", p.chip)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", p.dotClass)} />
              {p.label}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Due Date</span>
            <span className="text-xs font-medium">{format(parseISO(dueDate), "MMM d, yyyy")}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Assigned to</span>
            {task.assignedAgentName ? (
              <span className="inline-flex items-center gap-1 text-xs">
                <Bot className="w-3 h-3 text-primary" />
                {task.assignedAgentName}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>
            )}
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Ask AI to work on this
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Appointment Detail Modal ──────────────────────────────────────────────────

function AppointmentDetailModal({ apt, onClose, onEdit }: { apt: Appointment; onClose: () => void; onEdit: () => void }) {
  const { remove } = useCalendarStore();
  const meta = APT_TYPE_META[apt.type];
  const colors = APT_COLORS[apt.color] ?? APT_COLORS.blue;
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://book.example.com/${apt.title.toLowerCase().replace(/\s+/g,"-")}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <DialogContent className="max-w-md" aria-describedby="apt-detail-desc">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium", colors.chip)}>
            {meta.icon} {meta.label}
          </span>
        </div>
        <DialogTitle className="text-base">{apt.title}</DialogTitle>
      </DialogHeader>
      <div id="apt-detail-desc" className="flex flex-col gap-3 mt-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{format(parseISO(apt.date), "EEEE, MMMM d, yyyy")}</span>
        </div>
        {!apt.allDay && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{apt.startTime} – {apt.endTime}</span>
          </div>
        )}
        {apt.attendees.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1">
              {apt.attendees.map(a => (
                <span key={a} className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">{a}</span>
              ))}
            </div>
          </div>
        )}
        {apt.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{apt.location}</span>
          </div>
        )}
        {apt.videoLink && (
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-3.5 h-3.5 text-muted-foreground" />
            <a href={apt.videoLink} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate text-sm">
              {apt.videoLink}
            </a>
          </div>
        )}
        {apt.description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">{apt.description}</p>
        )}

        {/* Booking link */}
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
          <Share2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground flex-1 truncate">
            book.example.com/{apt.title.toLowerCase().replace(/\s+/g,"-")}
          </span>
          <button onClick={handleCopy} className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1">
            {linkCopied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {linkCopied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" onClick={onEdit} className="gap-1.5">Edit</Button>
          <Button
            size="sm" variant="destructive"
            onClick={() => { remove(apt.id); onClose(); }}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">Close</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Sidebar upcoming events ───────────────────────────────────────────────────

function UpcomingList({ events, onEventClick }: { events: CalEvent[]; onEventClick: (ev: CalEvent) => void }) {
  const upcoming = useMemo(() => {
    const today = new Date();
    return events
      .filter(ev => !isBefore(parseISO(ev.date), startOfWeek(today)))
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      })
      .slice(0, 8);
  }, [events]);

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {upcoming.map(ev => (
        <button
          key={ev.id}
          onClick={() => onEventClick(ev)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded hover:opacity-80 transition-opacity text-left w-full",
          )}
        >
          <span className={cn("w-2 h-2 rounded-full shrink-0", ev.dotClass)} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{ev.title}</p>
            <p className="text-[10px] text-muted-foreground/60">
              {format(parseISO(ev.date), "MMM d")}
              {!ev.allDay && ev.startTime ? ` · ${ev.startTime}` : " · All day"}
            </p>
          </div>
        </button>
      ))}
      {upcoming.length === 0 && (
        <p className="text-[11px] text-muted-foreground/50 px-2 py-2">No upcoming events</p>
      )}
    </div>
  );
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

type ModalState =
  | { kind: "none" }
  | { kind: "create-apt"; date?: Date; time?: string }
  | { kind: "edit-apt"; apt: Appointment }
  | { kind: "view-apt"; apt: Appointment }
  | { kind: "view-task"; task: Task; dueDate: string };

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { appointments } = useCalendarStore();

  const events = useMemo<CalEvent[]>(() => {
    const taskEvents = tasks
      .map(t => {
        const dueDate = TASK_DUE_DATES[t.id];
        if (!dueDate) return null;
        return taskToEvent(t, dueDate);
      })
      .filter((e): e is CalEvent => e !== null);

    const aptEvents = appointments.map(aptToEvent);
    return [...taskEvents, ...aptEvents];
  }, [tasks, appointments]);

  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDate(t);
  };

  const handleEventClick = (ev: CalEvent) => {
    if (ev.kind === "task" && ev.taskRef) {
      setModal({ kind: "view-task", task: ev.taskRef, dueDate: ev.date });
    } else if (ev.kind === "appointment" && ev.aptRef) {
      setModal({ kind: "view-apt", apt: ev.aptRef });
    }
  };

  const handleDayClick = (d: Date) => {
    setSelectedDate(d);
    if (viewMode === "month") {
      setCurrentDate(d);
      setViewMode("day");
    }
  };

  const titleLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return isSameMonth(start, end)
        ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
        : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    if (viewMode === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    return "Agenda";
  }, [currentDate, viewMode]);

  const totalEvents = events.length;
  const taskCount = events.filter(e => e.kind === "task").length;
  const aptCount = events.filter(e => e.kind === "appointment").length;

  return (
    <div className="flex h-full bg-background overflow-hidden" data-testid="calendar-page">
      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50 shrink-0">
          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 text-xs">Today</Button>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h1 className="text-sm font-semibold text-foreground flex-1">{titleLabel}</h1>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {([
              ["month", <LayoutGrid className="w-3.5 h-3.5" />, "Month"],
              ["week", <CalendarDays className="w-3.5 h-3.5" />, "Week"],
              ["day", <Calendar className="w-3.5 h-3.5" />, "Day"],
              ["agenda", <List className="w-3.5 h-3.5" />, "Agenda"],
            ] as [ViewMode, React.ReactNode, string][]).map(([mode, icon, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setModal({ kind: "create-apt", date: selectedDate })}
          >
            <Plus className="w-3.5 h-3.5" /> New Event
          </Button>
          <button
            onClick={() => setRightPanelOpen(p => !p)}
            aria-label={rightPanelOpen ? "Collapse calendar panel" : "Expand calendar panel"}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Calendar views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
                onCreateAtDate={(d) => setModal({ kind: "create-apt", date: d })}
              />
            )}
            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onCreateAtDateTime={(d, time) => setModal({ kind: "create-apt", date: d, time })}
              />
            )}
            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onCreateAtDateTime={(d, time) => setModal({ kind: "create-apt", date: d, time })}
              />
            )}
            {viewMode === "agenda" && (
              <AgendaView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Right panel (mini calendar + stats + upcoming) ── */}
      <div className={cn(
        "border-l border-border bg-card flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        rightPanelOpen ? "w-56" : "w-0"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0 min-w-[224px]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendar
          </h2>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setModal({ kind: "create-apt", date: selectedDate })}
          >
            <Plus className="w-3 h-3" /> New
          </Button>
        </div>

        <div className="min-w-[224px]">
          <MiniCalendar
            current={currentDate}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onNavigate={(d) => setCurrentDate(d)}
          />
        </div>

        <div className="border-t border-border pt-3 flex-1 overflow-y-auto min-w-[224px]">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Legend</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-blue-400" />Tasks (due dates)
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-purple-400" />Meetings
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-teal-400" />Calls
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />Demos
              </div>
            </div>
          </div>

          <div className="px-3 mb-3">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-muted/40 rounded-lg py-1.5">
                <p className="text-sm font-bold text-foreground">{totalEvents}</p>
                <p className="text-[9px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-muted/40 rounded-lg py-1.5">
                <p className="text-sm font-bold text-foreground">{taskCount}</p>
                <p className="text-[9px] text-muted-foreground">Tasks</p>
              </div>
              <div className="bg-muted/40 rounded-lg py-1.5">
                <p className="text-sm font-bold text-foreground">{aptCount}</p>
                <p className="text-[9px] text-muted-foreground">Apts</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">
              Upcoming
            </p>
            <UpcomingList events={events} onEventClick={handleEventClick} />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <Dialog open={modal.kind !== "none"} onOpenChange={(open) => !open && setModal({ kind: "none" })}>
        {modal.kind === "create-apt" && (
          <AppointmentModal
            defaultDate={modal.date}
            defaultTime={modal.time}
            onClose={() => setModal({ kind: "none" })}
          />
        )}
        {modal.kind === "edit-apt" && (
          <AppointmentModal
            initial={modal.apt}
            onClose={() => setModal({ kind: "none" })}
          />
        )}
        {modal.kind === "view-apt" && (
          <AppointmentDetailModal
            apt={modal.apt}
            onClose={() => setModal({ kind: "none" })}
            onEdit={() => setModal({ kind: "edit-apt", apt: modal.apt })}
          />
        )}
        {modal.kind === "view-task" && (
          <TaskEventModal
            task={modal.task}
            dueDate={modal.dueDate}
            onClose={() => setModal({ kind: "none" })}
          />
        )}
      </Dialog>
    </div>
  );
}
