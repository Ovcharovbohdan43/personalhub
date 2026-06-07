import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { user, profile: (data ?? null) as Profile | null };
}
