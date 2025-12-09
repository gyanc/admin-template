'use client';

import { useEffect } from 'react';
import { UseFormReset, FieldValues } from 'react-hook-form';

/**
 * Utility to reset a react-hook-form when the editing entity changes.
 * IMPORTANT: Pass mapToForm as a useCallback-wrapped function to prevent infinite loops
 */
export function useEditForm<TForm extends FieldValues>(
  editingEntity: any,
  reset: UseFormReset<TForm>,
  mapToForm: (entity: any) => Partial<TForm>
) {
  useEffect(() => {
    if (editingEntity) {
      reset(mapToForm(editingEntity));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEntity]);
}
