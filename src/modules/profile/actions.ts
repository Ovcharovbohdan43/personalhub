'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionState = { error?: string; ok?: boolean };

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const display_name = String(formData.get('displayName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: display_name || null,
    bio: bio || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true };
}

export async function uploadAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) return { error: 'Выберите файл' };
  if (file.size > 2 * 1024 * 1024) return { error: 'Максимум 2 МБ' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatar_url = `${publicUrl}?t=${Date.now()}`;

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    avatar_url,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { ok: true };
}
