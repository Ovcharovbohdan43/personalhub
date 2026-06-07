'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markNotificationReadAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from('app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/');
}
