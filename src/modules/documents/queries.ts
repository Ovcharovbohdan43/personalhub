import { createClient } from '@/lib/supabase/server';
import type { UserDocument } from '@/types/database';

export async function getDocuments(search?: string, tag?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('user_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (search?.trim()) {
    const safe = search.replace(/[%_,]/g, ' ');
    query = query.or(`title.ilike.%${safe}%,file_name.ilike.%${safe}%,description.ilike.%${safe}%,signed_by.ilike.%${safe}%`);
  }

  if (tag?.trim()) {
    query = query.contains('tags', [tag.trim()]);
  }

  const { data } = await query;
  return (data ?? []) as UserDocument[];
}

export async function getAllDocumentTags() {
  const supabase = await createClient();
  const { data } = await supabase.from('user_documents').select('tags');
  const tags = new Set<string>();

  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) tags.add(tag);
  }

  return [...tags].sort();
}
