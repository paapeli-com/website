import type { Metadata } from 'next';
import { AppShell } from '@/components/ai-readiness/assessment/AppShell';
import { OrgRequest } from '@/components/ai-readiness/assessment/OrgRequest';
import { AI_BASE } from '@/components/ai-readiness/links';

const URL = `https://www.paapeli.com${AI_BASE}/start/organization`;

export const metadata: Metadata = {
  title: 'درخواست ارزیابی سازمانی | ارزیابی آمادگی AI',
  description:
    'ارزیابی عمیق سازمانی با چند پاسخ‌دهنده، مصاحبه هوشمند و بررسی شواهد. درخواست خود را ثبت کنید تا برای هماهنگی تماس بگیریم.',
  alternates: { canonical: URL },
  robots: { index: false, follow: true },
};

export default function OrganizationRequestPage() {
  return (
    <AppShell>
      <OrgRequest />
    </AppShell>
  );
}
