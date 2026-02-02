'use client';

import { useRef, useCallback } from 'react';
import { updateDocument } from '@/lib/db';
import { DocumentInput } from '@/lib/types';

interface UseAutoSaveOptions {
  documentId: string | null;
  delay?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave({
  documentId,
  delay = 2000,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleAutoSave = useCallback(
    (data: DocumentInput) => {
      if (!documentId) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        onSaveStart?.();
        try {
          await updateDocument(documentId, data);
          onSaveSuccess?.();
        } catch (error) {
          onSaveError?.(error as Error);
        }
      }, delay);
    },
    [documentId, delay, onSaveStart, onSaveSuccess, onSaveError]
  );

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { scheduleAutoSave, cancelAutoSave };
}
