import { createClient } from '@/lib/supabase/server';
import type { Bookmark } from '@/types/database';

export async function getBookmarks(search?: string, type?: string) {
  const supabase = await createClient();
  let query = supabase.from('bookmarks').select('*').order('created_at', { ascending: false });

  if (search?.trim()) {
    query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (type?.trim()) {
    query = query.eq('type', type.trim());
  }

  const { data } = await query;
  return (data ?? []) as Bookmark[];
}
