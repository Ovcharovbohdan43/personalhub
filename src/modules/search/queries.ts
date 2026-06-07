import { createClient } from '@/lib/supabase/server';

export type SearchResults = {
  notes: { id: string; title: string; content: string }[];
  tasks: { id: string; title: string; status: string }[];
  bookmarks: { id: string; title: string; url: string }[];
  documents: { id: string; title: string; file_name: string; signed_by: string | null }[];
  transactions: { id: string; note: string | null; amount: number; type: string }[];
};

export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { notes: [], tasks: [], bookmarks: [], documents: [], transactions: [] };

  const supabase = await createClient();
  const safe = q.replace(/[%_,]/g, ' ');
  const pattern = `%${safe}%`;

  const [notesRes, tasksRes, bookmarksRes, documentsRes, transactionsRes] = await Promise.all([
    supabase.from('notes').select('id,title,content').or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(8),
    supabase.from('tasks').select('id,title,status').ilike('title', pattern).limit(8),
    supabase.from('bookmarks').select('id,title,url').or(`title.ilike.${pattern},url.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('user_documents').select('id,title,file_name,signed_by').or(`title.ilike.${pattern},file_name.ilike.${pattern},description.ilike.${pattern},signed_by.ilike.${pattern}`).limit(8),
    supabase.from('transactions').select('id,note,amount,type').ilike('note', pattern).limit(8),
  ]);

  return {
    notes: notesRes.data ?? [],
    tasks: tasksRes.data ?? [],
    bookmarks: bookmarksRes.data ?? [],
    documents: documentsRes.data ?? [],
    transactions: transactionsRes.data ?? [],
  };
}
