'use server';

import { getFinancialAssessmentContext } from './context';
import { getServerLocale } from '@/lib/locale';
import { isLocale } from '@/i18n/config';

export type AiAssessmentState = {
  error?: string;
  report?: string;
  generatedAt?: string;
};

function extractResponseText(response: unknown) {
  const data = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (data.output_text) return data.output_text;

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')
    .trim();
}

function buildSystemPrompt(locale: 'ru' | 'en') {
  if (locale === 'en') {
    return [
      'You are a financial analyst inside a personal hub app.',
      'Write in English, briefly and practically.',
      'User currency is GBP (£).',
      'Use only the provided data, do not invent facts.',
      'Do not provide legal, tax, or investment guarantees.',
      'Response format: markdown with sections: Overall assessment, Income and expenses, Credit obligations, Risks, What to do in the next 30 days, Advice to improve the situation.',
      'Do not end the report with questions to the user. Instead, give concrete advice on how to fix or improve the situation.',
      'If data is limited, clearly say what data should be added for a more accurate assessment, but phrase it as action recommendations, not questions.',
    ].join('\n');
  }

  return [
    'Ты финансовый аналитик внутри личного кабинета.',
    'Пиши по-русски, кратко и практично.',
    'Валюта пользователя GBP (£).',
    'Используй только переданные данные, не выдумывай факты.',
    'Не давай юридические, налоговые или инвестиционные гарантии.',
    'Формат ответа: markdown с разделами: Общая оценка, Доходы и расходы, Кредитные обязательства, Риски, Что сделать в ближайшие 30 дней, Советы по улучшению ситуации.',
    'Не заканчивай отчёт вопросами к пользователю. Вместо вопросов дай конкретные советы, как исправить или улучшить ситуацию.',
    'Если данных мало, явно скажи какие данные стоит добавить для более точной оценки, но оформи это как рекомендации к действию, а не как вопросы.',
  ].join('\n');
}

export async function generateAiAssessmentAction(_prev: AiAssessmentState, formData: FormData): Promise<AiAssessmentState> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fromForm = formData.get('locale');
  const locale = typeof fromForm === 'string' && isLocale(fromForm) ? fromForm : await getServerLocale();

  if (!apiKey) {
    return { error: locale === 'en' ? 'OPENAI_API_KEY is not configured on the server' : 'OPENAI_API_KEY не настроен на сервере' };
  }

  const context = await getFinancialAssessmentContext();
  const userPrompt = locale === 'en'
    ? `Analyze the user's financial situation based on JSON:\n${JSON.stringify(context, null, 2)}`
    : `Проанализируй финансовое состояние пользователя на основе JSON:\n${JSON.stringify(context, null, 2)}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      store: false,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: buildSystemPrompt(locale) }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
      max_output_tokens: 1800,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { error: `OpenAI API error: ${response.status} ${details.slice(0, 300)}` };
  }

  const data = await response.json();
  const report = extractResponseText(data);
  if (!report) {
    return { error: locale === 'en' ? 'OpenAI did not return report text' : 'OpenAI не вернул текст отчёта' };
  }

  return { report, generatedAt: new Date().toISOString() };
}
