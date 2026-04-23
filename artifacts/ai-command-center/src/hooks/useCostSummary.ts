import { useQuery } from '@tanstack/react-query';

export interface CostData {
  agentName: string;
  cost: number;
}

const mockCostData = {
  total: 1245.50,
  byAgent: [
    { agentName: "Orchestrator", cost: 450.20 },
    { agentName: "CodeReviewer", cost: 320.10 },
    { agentName: "DataAnalyst", cost: 180.50 },
    { agentName: "ResearchBot", cost: 210.00 },
    { agentName: "DocumentWriter", cost: 45.20 },
    { agentName: "SecurityScanner", cost: 39.50 },
  ],
  byDay: Array.from({length: 30}).map((_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    cost: Math.random() * 50 + 20
  }))
};

export const useCostSummary = () => {
  return useQuery({
    queryKey: ['cost-summary'],
    queryFn: () => Promise.resolve(mockCostData),
    initialData: mockCostData,
  });
};
