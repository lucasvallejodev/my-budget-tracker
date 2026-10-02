import { TemplatesSettings } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

export default function TemplatesSettingsPage() {
  return (
    <Page>
      <PageHeading
        title="Transaction templates"
        description="Saved transactions without a date. Pick one in the transaction form to record it in two taps."
      />
      <TemplatesSettings />
    </Page>
  );
}
