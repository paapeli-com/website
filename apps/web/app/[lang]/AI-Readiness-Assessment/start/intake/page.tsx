import type { Metadata } from 'next';
import { AppShell } from '@/components/ai-readiness/assessment/AppShell';
import { IntakeFlow } from '@/components/ai-readiness/assessment/IntakeFlow';
import { AI_BASE } from '@/components/ai-readiness/links';

const URL = `https://www.paapeli.com${AI_BASE}/start/intake`;

export const metadata: Metadata = {
  title: 'اطلاعات سازمان | ارزیابی آمادگی AI',
  description: 'چند سؤال کوتاه درباره سازمان شما، برای شخصی‌سازی مسیر ارزیابی.',
  alternates: { canonical: URL },
  robots: { index: false, follow: true },
};

export default function AssessmentIntakePage() {
  return (
    <AppShell>
      <IntakeFlow />
    </AppShell>
  );
}
