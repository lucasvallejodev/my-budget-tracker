import { Analytics } from '@/components/finance';
import type { AnalyticsParams } from '@/lib/analytics-filters';

export default async function Page({ searchParams }: { searchParams: Promise<AnalyticsParams> }) {
  return <Analytics view="overview" params={await searchParams} />;
}
