'use server';

import { createClient } from '@/lib/supabase/server';
import { getServerLocale } from '@/lib/locale';
import { withLocale } from '@/i18n/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const documentSchema = z.object({
  title: z.preprocess((value) => value ?? '', z.string().trim().min(1, 'Введите подпись/название документа')),
  description: z.preprocess((value) => value ?? '', z.string()),
  tags: z.preprocess((value) => value ?? '', z.string()),
  signedBy: z.preprocess((value) => value ?? '', z.string()),
});

export type ActionState = { error?: string; ok?: boolean; message?: string };

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'document';
}

export async function uploadDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = documentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    tags: formData.get('tags'),
    signedBy: formData.get('signedBy'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля документа' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Выберите файл' };
  if (file.size > MAX_FILE_SIZE) return { error: 'Файл слишком большой. Максимум 50 МБ' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });
  if (uploadError) return { error: uploadError.message };

  const tags = parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  const signedBy = parsed.data.signedBy.trim();

  const { error } = await supabase.from('user_documents').insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description.trim() || null,
    tags,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    signed_by: signedBy || null,
    signed_at: signedBy ? new Date().toISOString() : null,
  });

  if (error) {
    await supabase.storage.from('documents').remove([storagePath]);
    return { error: error.message };
  }

  revalidatePath('/documents');
  return { ok: true, message: 'Документ загружен' };
}

export async function updateDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  const parsed = documentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    tags: formData.get('tags'),
    signedBy: formData.get('signedBy'),
  });
  if (!id) return { error: 'Документ не найден' };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля документа' };

  const supabase = await createClient();
  const signedBy = parsed.data.signedBy.trim();
  const tags = parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  const { error } = await supabase
    .from('user_documents')
    .update({
      title: parsed.data.title,
      description: parsed.data.description.trim() || null,
      tags,
      signed_by: signedBy || null,
      signed_at: signedBy ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/documents');
  return { ok: true, message: 'Документ обновлён' };
}

export async function downloadDocumentAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();

  const { data: document } = await supabase
    .from('user_documents')
    .select('storage_path,file_name')
    .eq('id', id)
    .single();

  const locale = await getServerLocale();
  if (!document) redirect(withLocale(locale, '/documents'));

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.storage_path, 60, { download: document.file_name });

  if (error || !data?.signedUrl) redirect(withLocale(locale, '/documents'));
  redirect(data.signedUrl);
}

export async function deleteDocumentAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();

  const { data: document } = await supabase
    .from('user_documents')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (document?.storage_path) {
    await supabase.storage.from('documents').remove([document.storage_path]);
  }

  await supabase.from('user_documents').delete().eq('id', id);
  revalidatePath('/documents');
}
