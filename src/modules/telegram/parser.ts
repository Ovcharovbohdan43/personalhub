import type { ParsedCommand } from '@/modules/telegram/types';

function stripBotSuffix(command: string) {
  return command.replace(/@\w+$/i, '');
}

function parseStart(text: string): ParsedCommand | null {
  if (!/^\/start(?:@\w+)?(?:\s|$)/i.test(text)) return null;
  const token = text.replace(/^\/start(?:@\w+)?\s*/i, '').trim();
  return { kind: 'start', token: token || undefined };
}

function parseAmount(value: string) {
  const amount = Number(value.replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

export function parseTelegramCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  const start = parseStart(trimmed);
  if (start) return start;

  const parts = trimmed.split(/\s+/);
  const rawCommand = parts[0] ?? '';
  const command = stripBotSuffix(rawCommand).toLowerCase();
  const rest = trimmed.slice(rawCommand.length).trim();

  if (command === '/help') return { kind: 'help' };
  if (command === '/tasks') {
    return { kind: 'tasks', filter: parts[1]?.toLowerCase() === 'done' ? 'done' : 'open' };
  }
  if (command === '/add') {
    const title = rest.trim();
    if (title) return { kind: 'task_add', title };
  }
  if (command === '/task') {
    const action = parts[1]?.toLowerCase();
    if (action === 'add') {
      const title = parts.slice(2).join(' ').trim();
      if (title) return { kind: 'task_add', title };
    }
    if (action === 'done' || action === 'start') {
      const index = Number(parts[2]);
      if (Number.isInteger(index) && index >= 1) {
        return { kind: 'task_status', index, status: action === 'done' ? 'done' : 'in_progress' };
      }
    }
    if (action === 'delete') {
      const index = Number(parts[2]);
      if (Number.isInteger(index) && index >= 1) return { kind: 'task_delete', index };
    }
    if (action === 'edit') {
      const index = Number(parts[2]);
      const title = parts.slice(3).join(' ').trim();
      if (Number.isInteger(index) && index >= 1 && title) return { kind: 'task_edit', index, title };
    }
    if (action === 'due') {
      const index = Number(parts[2]);
      const dueDate = parseDate(parts[3] ?? '');
      if (Number.isInteger(index) && index >= 1 && dueDate) return { kind: 'task_due', index, dueDate };
    }
  }
  if (command === '/fin') return { kind: 'fin' };
  if (command === '/tx') {
    const action = parts[1]?.toLowerCase();
    if (action === 'list') return { kind: 'tx_list' };
    if (action === 'delete') {
      const index = Number(parts[2]);
      if (Number.isInteger(index) && index >= 1) return { kind: 'tx_delete', index };
    }
    if (action === 'edit') {
      const index = Number(parts[2]);
      const field = parts[3]?.toLowerCase();
      const value = parts.slice(4).join(' ').trim();
      if (
        Number.isInteger(index) && index >= 1 &&
        (field === 'amount' || field === 'note' || field === 'date' || field === 'type') &&
        value
      ) {
        return { kind: 'tx_edit', index, field, value };
      }
    }
    if (action === 'add') {
      const txType = parts[2]?.toLowerCase();
      const amount = parseAmount(parts[3] ?? '');
      if ((txType === 'income' || txType === 'expense') && amount) {
        const tail = parts.slice(4);
        const maybeCategory = tail[0];
        const categoryName = maybeCategory && Number.isNaN(Number(maybeCategory)) ? maybeCategory : undefined;
        const note = categoryName ? tail.slice(1).join(' ') || categoryName : tail.join(' ');
        return {
          kind: 'tx_add',
          txType,
          amount,
          categoryName,
          note: note.trim() || (categoryName ?? txType),
        };
      }
    }
  }
  if (command === '/budget') {
    const action = parts[1]?.toLowerCase();
    if (action === 'list') return { kind: 'budget_list' };
    if (action === 'set') {
      const limitAmount = parseAmount(parts[parts.length - 1] ?? '');
      const categoryName = parts.slice(2, -1).join(' ').trim();
      if (categoryName && limitAmount) return { kind: 'budget_set', categoryName, limitAmount };
    }
  }
  if (command === '/cards') return { kind: 'cards_list' };
  if (command === '/card') {
    const action = parts[1]?.toLowerCase();
    if (action === 'add') {
      const creditLimit = parseAmount(parts[parts.length - 1] ?? '');
      const name = parts.slice(2, -1).join(' ').trim();
      if (name && creditLimit) return { kind: 'card_add', name, creditLimit };
    }
    if (action === 'archive') {
      const index = Number(parts[2]);
      if (Number.isInteger(index) && index >= 1) return { kind: 'card_archive', index };
    }
    if (action === 'pay') {
      const index = Number(parts[2]);
      const amount = parseAmount(parts[3] ?? '');
      if (Number.isInteger(index) && index >= 1 && amount) return { kind: 'card_pay', index, amount };
    }
  }
  if (command.startsWith('/')) return { kind: 'plain_text', text: trimmed };
  return { kind: 'plain_text', text: trimmed };
}
