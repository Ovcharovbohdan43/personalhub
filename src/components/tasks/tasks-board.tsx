'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { updateTaskStatusAction, deleteTaskAction } from '@/modules/tasks/actions';
import { formatDate, getPriorityLabels } from '@/lib/format';
import { useLanguage } from '@/components/providers/language-provider';
import type { Task } from '@/types/database';

export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { dictionary: t, locale } = useLanguage();
  const priorityLabels = getPriorityLabels(t);

  const cols = [
    ['todo', t.tasks.todo],
    ['in_progress', t.tasks.inProgress],
    ['done', t.tasks.done],
  ] as const;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={`rounded-lg px-3 py-1 text-sm ${view === 'kanban' ? 'bg-primary/20 text-primary' : 'bg-muted'}`} onClick={() => setView('kanban')}>{t.tasks.kanban}</button>
        <button type="button" className={`rounded-lg px-3 py-1 text-sm ${view === 'list' ? 'bg-primary/20 text-primary' : 'bg-muted'}`} onClick={() => setView('list')}>{t.tasks.list}</button>
      </div>

      {view === 'kanban' ? (
        <div className="grid min-w-0 gap-5 lg:grid-cols-3">
          {cols.map(([key, label]) => (
            <Card key={key} className="min-w-0 p-4">
              <div className="mb-4 flex justify-between">
                <h2 className="font-semibold">{label}</h2>
                <span className="text-muted-foreground">{tasks.filter((task) => task.status === key).length}</span>
              </div>
              <div className="space-y-3">
                {tasks.filter((task) => task.status === key).map((task) => (
                  <TaskCard key={task.id} task={task} column={key} priorityLabels={priorityLabels} locale={locale} labels={t} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="min-w-0 divide-y">
          {[...tasks].sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')).map((task) => (
            <div key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{priorityLabels[task.priority]} · {formatDate(task.due_date, locale)} · {task.status}</p>
              </div>
              {task.status !== 'done' ? (
                <form action={updateTaskStatusAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="status" value={task.status === 'todo' ? 'in_progress' : 'done'} />
                  <button className="text-xs text-primary" type="submit">{task.status === 'todo' ? t.tasks.toWork : t.tasks.complete}</button>
                </form>
              ) : null}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function TaskCard({
  task,
  column,
  priorityLabels,
  locale,
  labels,
}: {
  task: Task;
  column: string;
  priorityLabels: Record<number, string>;
  locale: 'ru' | 'en';
  labels: ReturnType<typeof useLanguage>['dictionary'];
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/60 p-4">
      <p className="break-words">{task.title}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="rounded-lg bg-muted px-2 py-1">{priorityLabels[task.priority]}</span>
        <span>{formatDate(task.due_date, locale)}</span>
      </div>
      <div className="mt-3 flex gap-3">
        {column !== 'done' ? (
          <form action={updateTaskStatusAction}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="status" value={column === 'todo' ? 'in_progress' : 'done'} />
            <button className="text-xs text-primary" type="submit">{column === 'todo' ? labels.tasks.toWork : labels.tasks.complete}</button>
          </form>
        ) : null}
        <form action={deleteTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <button className="text-xs text-red-400" type="submit">{labels.common.delete}</button>
        </form>
      </div>
    </div>
  );
}
