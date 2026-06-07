'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export function useActionToast(state: { error?: string; ok?: boolean; message?: string }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) showToast(state.error, 'error');
    if (state.ok) showToast(state.message ?? 'Сохранено', 'success');
  }, [showToast, state.error, state.ok, state.message]);
}
