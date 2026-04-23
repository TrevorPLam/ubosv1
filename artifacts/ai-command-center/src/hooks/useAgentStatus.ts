import { useQuery } from '@tanstack/react-query';
import { getAgents, mockAgents } from '@/api/agents';
import { useEffect, useState } from 'react';

export const useAgentStatus = () => {
  const { data: agents = mockAgents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    initialData: mockAgents,
  });

  const [liveAgents, setLiveAgents] = useState(agents);

  // Simulate subtle updates
  useEffect(() => {
    const i = setInterval(() => {
      setLiveAgents(prev => 
        prev.map(a => {
          if (a.status === 'thinking' || a.status === 'running-tool') {
             return { ...a, memoryUsageMB: a.memoryUsageMB + Math.floor(Math.random() * 10 - 5) };
          }
          return a;
        })
      );
    }, 2000);
    return () => clearInterval(i);
  }, []);

  return {
    agents: liveAgents,
    isLoading
  };
};
