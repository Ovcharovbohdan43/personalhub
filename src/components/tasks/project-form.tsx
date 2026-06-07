'use client';

import { useActionState } from 'react';
import { createProjectAction, type ActionState } from '@/modules/tasks/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function ProjectForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProjectAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.tasks.planCreated : undefined });

  return (
    <form action={action} className="glass grid gap-3 p-4 md:grid-cols-4">
      <Input name="title" placeholder={t.tasks.planTitle} className="md:col-span-2" required />
      <Input name="targetDate" type="date" />
      <Button type="submit" disabled={pending}>{t.tasks.newProject}</Button>
      <Input name="description" placeholder={t.tasks.descriptionOptional} className="md:col-span-4" />
      {state.error ? <p className="text-sm text-red-400 md:col-span-4">{state.error}</p> : null}
    </form>
  );
}
