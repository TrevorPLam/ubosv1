import { create } from 'zustand';

export type AppointmentType = 'meeting' | 'call' | 'demo' | 'interview' | 'reminder';

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  description: string;
  attendees: string[];
  location: string;
  videoLink: string;
  color: string;
}

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');

function d(day: number) {
  return `${y}-${m}-${String(day).padStart(2, '0')}`;
}

const SEED: Appointment[] = [
  {
    id: 'apt-1', title: 'Team Standup', type: 'meeting',
    date: d(8), startTime: '09:00', endTime: '09:30', allDay: false,
    description: 'Daily team sync across all agent squads.',
    attendees: ['Orchestrator', 'ResearchBot', 'CodeReviewer'],
    location: '', videoLink: 'https://meet.example.com/standup', color: 'purple',
  },
  {
    id: 'apt-2', title: 'Alpha Pipeline Review', type: 'meeting',
    date: d(12), startTime: '14:00', endTime: '15:00', allDay: false,
    description: 'Review progress on the multi-agent orchestration pipeline.',
    attendees: ['Orchestrator', 'DataAnalyst'],
    location: 'Conference Room A', videoLink: '', color: 'blue',
  },
  {
    id: 'apt-3', title: 'Security Audit Planning', type: 'meeting',
    date: d(15), startTime: '09:00', endTime: '10:30', allDay: false,
    description: 'Plan the Q2 security audit scope and assign responsibilities.',
    attendees: ['SecurityScanner', 'Orchestrator'],
    location: '', videoLink: 'https://meet.example.com/security', color: 'red',
  },
  {
    id: 'apt-4', title: 'Stakeholder Demo', type: 'demo',
    date: d(20), startTime: '13:00', endTime: '14:00', allDay: false,
    description: 'Live demo of the new AI Command Center to external stakeholders.',
    attendees: ['All Agents'],
    location: 'Board Room', videoLink: '', color: 'indigo',
  },
  {
    id: 'apt-5', title: '1:1 with CodeReviewer', type: 'call',
    date: d(22), startTime: '15:30', endTime: '16:00', allDay: false,
    description: 'Weekly check-in on code review backlog.',
    attendees: ['CodeReviewer'],
    location: '', videoLink: 'https://meet.example.com/1on1', color: 'teal',
  },
  {
    id: 'apt-6', title: 'Infra Architecture Interview', type: 'interview',
    date: d(27), startTime: '11:00', endTime: '12:00', allDay: false,
    description: 'Technical interview for senior infrastructure engineer candidate.',
    attendees: ['Orchestrator', 'SecurityScanner'],
    location: 'Interview Suite', videoLink: '', color: 'pink',
  },
  {
    id: 'apt-7', title: 'Sprint Planning', type: 'meeting',
    date: d(1), startTime: '10:00', endTime: '11:30', allDay: false,
    description: 'Plan tasks and priorities for the upcoming two-week sprint.',
    attendees: ['Orchestrator', 'ResearchBot', 'CodeReviewer', 'DataAnalyst'],
    location: '', videoLink: 'https://meet.example.com/planning', color: 'purple',
  },
  {
    id: 'apt-8', title: 'Data Pipeline Handoff', type: 'call',
    date: d(5), startTime: '16:00', endTime: '16:30', allDay: false,
    description: 'Handoff meeting for the ETL pipeline rebuild.',
    attendees: ['DataAnalyst'],
    location: '', videoLink: '', color: 'teal',
  },
];

interface CalendarStore {
  appointments: Appointment[];
  add: (apt: Omit<Appointment, 'id'>) => void;
  update: (id: string, updates: Partial<Appointment>) => void;
  remove: (id: string) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  appointments: SEED,
  add: (apt) =>
    set((s) => ({
      appointments: [...s.appointments, { ...apt, id: `apt-${Date.now()}` }],
    })),
  update: (id, updates) =>
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  remove: (id) =>
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
}));
