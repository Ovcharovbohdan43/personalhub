import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/types/database';

export async function getNotes(search?: string, tag?: string) {
  const supabase = await createClient();
  let query = supabase.from('notes').select('*').order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

  if (search?.trim()) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  if (tag?.trim()) {
    query = query.contains('tags', [tag.trim()]);
  }

  const { data } = await query;
  return (data ?? []) as Note[];
}

export async function getAllNoteTags() {
  const supabase = await createClient();
  const { data } = await supabase.from('notes').select('tags');
  const tags = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) tags.add(tag);
  }
  return [...tags].sort();
}
