'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type ActionState = { error?: string; ok?: boolean };

export async function createTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Введите название' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const projectId = String(formData.get('projectId') ?? '') || null;

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    status: 'todo',
    priority: Number(formData.get('priority') ?? 2),
    due_date: String(formData.get('dueDate') ?? '') || null,
    project_id: projectId,
  });
  if (error) return { error: error.message };
  revalidatePath('/tasks');
  revalidatePath('/');
  return { ok: true };
}

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    title: z.preprocess((value) => value ?? '', z.string().trim().min(1, 'Введите название плана')),
    description: z.preprocess((value) => value ?? '', z.string()),
    targetDate: z.preprocess((value) => value ?? '', z.string()),
  }).safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    targetDate: formData.get('targetDate'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Введите название плана' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description.trim() || null,
    target_date: parsed.data.targetDate.trim() || null,
    status: 'active',
  });
  if (error) return { error: error.message };
  revalidatePath('/tasks');
  return { ok: true };
}

export async function updateTaskStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'todo') as 'todo' | 'in_progress' | 'done';
  const supabase = await createClient();
  await supabase.from('tasks').update({
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }).eq('id', id);
  revalidatePath('/tasks');
  revalidatePath('/');
}

export async function deleteTaskAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('tasks').delete().eq('id', id);
  revalidatePath('/tasks');
  revalidatePath('/');
}
