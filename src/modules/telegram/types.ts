import type { Locale } from '@/i18n/config';
import type { TelegramConnection } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

export type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: TelegramUser;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

export type BotContext = {
  connection: TelegramConnection;
  supabase: SupabaseClient;
  locale: Locale;
  chatId: number;
};

export type ParsedCommand =
  | { kind: 'start'; token?: string }
  | { kind: 'help' }
  | { kind: 'tasks'; filter: 'open' | 'done' }
  | { kind: 'task_add'; title: string }
  | { kind: 'task_status'; index: number; status: 'in_progress' | 'done' }
  | { kind: 'task_edit'; index: number; title: string }
  | { kind: 'task_due'; index: number; dueDate: string }
  | { kind: 'task_delete'; index: number }
  | { kind: 'fin' }
  | { kind: 'tx_list' }
  | { kind: 'tx_add'; txType: 'income' | 'expense'; amount: number; categoryName?: string; note: string }
  | { kind: 'tx_edit'; index: number; field: 'amount' | 'note' | 'date' | 'type'; value: string }
  | { kind: 'tx_delete'; index: number }
  | { kind: 'budget_list' }
  | { kind: 'budget_set'; categoryName: string; limitAmount: number }
  | { kind: 'cards_list' }
  | { kind: 'card_add'; name: string; creditLimit: number }
  | { kind: 'card_pay'; index: number; amount: number }
  | { kind: 'card_archive'; index: number }
  | { kind: 'plain_text'; text: string };
