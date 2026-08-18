import type { Metadata } from 'next';
import { AppShell } from '@/components/ai-readiness/assessment/AppShell';
import { ModeSelection } from '@/components/ai-readiness/assessment/ModeSelection';
import { AI_BASE } from '@/components/ai-readiness/links';

const URL = `https://www.paapeli.com${AI_BASE}/start`;

export const metadata: Metadata = {
  title: 'انتخاب نوع ارزیابی آمادگی AI | Paapeli × Rayka',
  description:
    'مسیر ارزیابی متناسب با زمان و عمق تحلیلی مورد نیاز خود را انتخاب کنید: ارزیابی سریع، ارزیابی کامل یا ارزیابی عمیق سازمانی.',
  alternates: { canonical: URL },
  // The app screens are a funnel, not content: keep them out of the index and
  // let the marketing pages carry the search presence.
  robots: { index: false, follow: true },
};

export default function AssessmentStartPage() {
  return (
    <AppShell>
      <ModeSelection />
    </AppShell>
  );
}
