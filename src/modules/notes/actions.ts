'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerLocale } from '@/lib/locale';
import { withLocale } from '@/i18n/config';

const noteSchema = z.object({
  title: z.preprocess((value) => value ?? '', z.string().trim().min(1, 'Заполните заголовок')),
  content: z.preprocess((value) => value ?? '', z.string()),
  tags: z.preprocess((value) => value ?? '', z.string()),
  id: z.preprocess((value) => value ?? '', z.string().uuid().or(z.literal(''))),
});

export type ActionState = { error?: string; ok?: boolean; message?: string };

export async function saveNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = noteSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    tags: formData.get('tags'),
    id: formData.get('id'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля заметки' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const tags = parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const payload = {
    user_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    tags,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.id) {
    const { error } = await supabase.from('notes').update(payload).eq('id', parsed.data.id).eq('user_id', user.id);
    if (error) return { error: error.message };
    revalidatePath('/notes');
    revalidatePath('/');
    return { ok: true, message: 'Заметка сохранена' };
  }

  const { data, error } = await supabase.from('notes').insert(payload).select('id').single();
  if (error) return { error: error.message };
  revalidatePath('/notes');
  revalidatePath('/');
  const locale = await getServerLocale();
  redirect(withLocale(locale, `/notes?id=${data.id}`));
}

export async function deleteNoteAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('notes').delete().eq('id', id);
  revalidatePath('/notes');
  revalidatePath('/');
}

export async function togglePinNoteAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const pinned = formData.get('pinned') === 'true';
  const supabase = await createClient();
  await supabase.from('notes').update({ is_pinned: !pinned, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/notes');
}
