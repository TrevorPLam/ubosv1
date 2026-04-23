export const API_BASE = "http://localhost:8000";

// Mock fetch wrapper to simulate API latency
export const mockFetch = <T>(data: T, delayMs: number = 300): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
};
