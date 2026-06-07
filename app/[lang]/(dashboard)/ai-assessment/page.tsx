import { AiAssessmentPanel } from '@/components/ai-assessment/ai-assessment-panel';
import { getPageLocale } from '@/i18n/page';

export default async function AiAssessmentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { dictionary: t } = await getPageLocale(params);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.aiAssessment.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.aiAssessment.subtitle}</p>
      </div>
      <AiAssessmentPanel />
    </>
  );
}
