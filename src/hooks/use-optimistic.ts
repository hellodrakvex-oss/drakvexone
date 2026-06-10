import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for handling optimistic UI updates
 * Pattern:
 * 1. Update UI immediately (optimistic)
 * 2. Send request to server in background
 * 3. If success - keep UI update
 * 4. If fail - revert UI and show error
 *
 * Usage:
 * ```typescript
 * const { execute } = useOptimisticUpdate({
 *   onSuccess: () => toast.success('Updated!'),
 * });
 *
 * await execute(
 *   () => setLocalData(newValue), // Optimistic update
 *   () => supabase.from('table').update(...), // Actual request
 *   () => fetchLatest() // Revert if failed
 * );
 * ```
 */
export function useOptimisticUpdate<T>(
  options: OptimisticUpdateOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    successMessage = 'Updated successfully',
    errorMessage = 'Failed to update',
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      optimisticUpdate: () => void,
      serverOperation: () => Promise<T>,
      revertUpdate: () => void
    ) => {
      try {
        // Step 1: Update UI immediately
        optimisticUpdate();

        // Step 2: Send request to server
        const result = await serverOperation();

        // Step 3: Success - keep UI update
        if (successMessage) {
          toast.success(successMessage);
        }

        onSuccess?.(result);
        return result;
      } catch (error) {
        // Step 4: Failure - revert UI
        revertUpdate();

        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Optimistic update failed:', errorObj);

        if (errorMessage) {
          toast.error(errorMessage);
        }

        onError?.(errorObj);
        throw errorObj;
      }
    },
    [onSuccess, onError, successMessage, errorMessage]
  );

  return { execute };
}

/**
 * Hook for batch optimistic updates
 * Useful for delete operations that show toast with undo
 */
export function useOptimisticDelete<T>(options: OptimisticUpdateOptions<T> = {}) {
  const { successMessage = 'Deleted successfully', ...rest } = options;

  const { execute } = useOptimisticUpdate({
    successMessage,
    ...rest,
  });

  const deleteWithUndo = useCallback(
    async (
      optimisticDelete: () => void,
      serverDelete: () => Promise<T>,
      revertDelete: () => void,
      undoLabel: string = 'Undo'
    ) => {
      try {
        // Optimistic delete
        optimisticDelete();

        // Server delete
        await serverDelete();

        // Success toast with no undo (already deleted server-side)
        toast.success('Deleted successfully');
      } catch (error) {
        // Revert and show error
        revertDelete();
        const errorObj = error instanceof Error ? error : new Error(String(error));
        toast.error('Failed to delete', {
          description: errorObj.message,
        });
        throw errorObj;
      }
    },
    []
  );

  return { deleteWithUndo };
}
