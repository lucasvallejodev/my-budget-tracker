import { RulesSettings } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

export default function RulesSettingsPage() {
  return (
    <Page>
      <PageHeading
        title="Categorisation rules"
        description="Simple text rules that assign a category on import and to existing uncategorised entries."
      />
      <RulesSettings />
    </Page>
  );
}
