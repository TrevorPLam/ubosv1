import { useState, useCallback } from 'react';

export interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isCopied: boolean;
  isSupported: boolean;
}

export function useClipboard(): UseClipboardReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isSupported = typeof window !== 'undefined' && 'clipboard' in navigator;

  const copy = useCallback(async (text: string) => {
    if (!text) {
      setError(new Error('Cannot copy empty text'));
      return;
    }

    if (!isSupported) {
      setError(new Error('Clipboard API not supported in this environment'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsCopied(false);

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      // Reset feedback after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
      setError(error);
      setIsCopied(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { copy, isLoading, error, isCopied, isSupported };
}
