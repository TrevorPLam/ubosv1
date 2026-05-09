/**
 * @file        artifacts/ai-command-center/src/hooks/useBackgroundTask.ts
 * @module      Utilities / Async
 * @purpose     React hook to execute background tasks with progress tracking and cancellation
 *
 * @ai_instructions
 *   - Must properly handle task cancellation and cleanup
 *   - Must call onComplete and onError callbacks appropriately
 *   - Currently simulates background processing with setTimeout
 *   - DO NOT modify delay duration without considering UX impact
 *
 * @exports     useBackgroundTask, BackgroundTask
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState, useCallback, useRef } from 'react';

export interface BackgroundTask<T = any> {
  id: string;
  execute: () => Promise<T>;
  onComplete?: (result: T) => void;
  onError?: (error: Error) => void;
}

export function useBackgroundTask() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const executeTask = useCallback(async <T>(task: BackgroundTask<T>): Promise<T> => {
    setIsRunning(true);
    setCurrentTask(task.id);

    try {
      // For now, execute in main thread with setTimeout to simulate background processing
      // In a real implementation, you would use Web Workers for CPU-intensive tasks
      const result = await new Promise<T>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const taskResult = await task.execute();
            resolve(taskResult);
          } catch (error) {
            reject(error);
          }
        }, 100);
      });

      task.onComplete?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      task.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsRunning(false);
      setCurrentTask(null);
    }
  }, []);

  const cancelTask = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    setCurrentTask(null);
  }, []);

  return {
    isRunning,
    currentTask,
    executeTask,
    cancelTask,
  };
}
