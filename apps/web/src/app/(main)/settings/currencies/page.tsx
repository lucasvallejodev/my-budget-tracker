import { CurrencySettings } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

export default function CurrenciesSettingsPage() {
  return (
    <Page>
      <PageHeading
        title="Currencies"
        description="Your primary currency, converted totals and manually maintained exchange rates."
      />
      <CurrencySettings />
    </Page>
  );
}
