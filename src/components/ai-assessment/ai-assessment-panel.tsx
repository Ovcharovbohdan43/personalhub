'use client';

import { useActionState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Loader2, ShieldCheck } from 'lucide-react';
import { generateAiAssessmentAction, type AiAssessmentState } from '@/modules/ai-assessment/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';

export function AiAssessmentPanel() {
  const [state, action, pending] = useActionState<AiAssessmentState, FormData>(generateAiAssessmentAction, {});
  const { dictionary: t, locale } = useLanguage();

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_1fr]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain size={18} /> {t.aiAssessment.panelTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.aiAssessment.panelDescription}</p>

          <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 flex items-center gap-2 font-medium text-foreground"><ShieldCheck size={14} /> {t.aiAssessment.privacyTitle}</p>
            <p>{t.aiAssessment.privacyDescription}</p>
          </div>

          <form action={action}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" disabled={pending} className="w-full gap-2">
              {pending ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
              {pending ? t.aiAssessment.generating : t.aiAssessment.generate}
            </Button>
          </form>

          {state.error ? <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p> : null}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{t.aiAssessment.reportTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {state.report ? (
            <article className="prose prose-invert max-w-none break-words text-sm leading-7">
              <ReactMarkdown>{state.report}</ReactMarkdown>
            </article>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              <div>
                <Brain className="mx-auto mb-3 h-10 w-10" />
                <p className="font-medium text-foreground">{t.aiAssessment.emptyTitle}</p>
                <p className="mt-1">{t.aiAssessment.emptyHint}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
