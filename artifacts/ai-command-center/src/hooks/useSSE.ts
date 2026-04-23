import { useEffect, useState } from "react";

type SSEEvent = {
  id: string;
  type: string;
  data: any;
  timestamp: string;
};

export const useSSE = (endpoint: string, options?: { enabled?: boolean }) => {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    // Simulate SSE connection
    const interval = setInterval(() => {
      const types = ['log', 'metric', 'status'];
      const newEvent: SSEEvent = {
        id: `ev-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        data: { message: `Simulated event at ${new Date().toISOString()}` },
        timestamp: new Date().toISOString()
      };
      
      setEvents(prev => [...prev.slice(-49), newEvent]); // Keep last 50
    }, 4000);

    return () => clearInterval(interval);
  }, [endpoint, enabled]);

  return events;
};
