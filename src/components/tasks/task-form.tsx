'use client';

import { useActionState } from 'react';
import { createTaskAction, type ActionState } from '@/modules/tasks/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';
import type { Project } from '@/types/database';

export function TaskForm({ projects }: { projects: Project[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTaskAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.tasks.taskAdded : undefined });

  return (
    <form action={action} className="glass flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <Input name="title" placeholder={t.tasks.taskTitle} className="w-full sm:min-w-[220px] sm:flex-1" required />
      <select name="projectId" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto">
        <option value="">{t.tasks.noPlan}</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.title}</option>
        ))}
      </select>
      <Input name="dueDate" type="date" className="w-full sm:w-auto" />
      <select name="priority" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto" defaultValue="2">
        <option value="1">{t.priority.high}</option>
        <option value="2">{t.priority.medium}</option>
        <option value="3">{t.priority.low}</option>
      </select>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">{t.common.add}</Button>
      {state.error ? <p className="w-full text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
