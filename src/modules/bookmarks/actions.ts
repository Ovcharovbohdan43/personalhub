'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchUrlMetadata } from '@/lib/url-metadata';
import { revalidatePath } from 'next/cache';

export type ActionState = { error?: string; ok?: boolean };

function detectType(url: string): 'link' | 'video' | 'article' {
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return 'video';
  if (/habr\.com|medium\.com|dev\.to/i.test(url)) return 'article';
  return 'link';
}

export async function createBookmarkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  if (!url) return { error: 'Укажите URL' };

  const metadata = await fetchUrlMetadata(url);
  if (!title) title = metadata.title ?? url;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const tags = String(formData.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const { error } = await supabase.from('bookmarks').insert({
    user_id: user.id,
    title,
    url,
    type: detectType(url),
    description: String(formData.get('description') ?? '') || metadata.description || null,
    tags,
    metadata: metadata as Record<string, unknown>,
  });
  if (error) return { error: error.message };
  revalidatePath('/bookmarks');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteBookmarkAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('bookmarks').delete().eq('id', id);
  revalidatePath('/bookmarks');
  revalidatePath('/');
}
