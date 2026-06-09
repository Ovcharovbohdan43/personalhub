import type { SupabaseClient } from '@supabase/supabase-js';

export type PendingAction = {
  chat_id: number;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  expires_at: string;
};

const TTL_MINUTES = 15;

function expiresAt() {
  return new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();
}

export async function setPendingAction(
  supabase: SupabaseClient,
  input: {
    chatId: number;
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  },
) {
  await supabase.from('telegram_pending_actions').upsert({
    chat_id: input.chatId,
    user_id: input.userId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
    expires_at: expiresAt(),
  });
}

export async function getPendingAction(supabase: SupabaseClient, chatId: number) {
  const { data } = await supabase
    .from('telegram_pending_actions')
    .select('*')
    .eq('chat_id', chatId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return data as PendingAction | null;
}

export async function clearPendingAction(supabase: SupabaseClient, chatId: number) {
  await supabase.from('telegram_pending_actions').delete().eq('chat_id', chatId);
}
