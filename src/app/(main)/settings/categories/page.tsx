import { CategoryManager } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

export default function CategoriesSettingsPage() {
  return (
    <Page>
      <PageHeading
        title="Categories"
        description="Groups carry the colour and whether they are income or expense; categories carry the icon. Archive instead of deleting so history stays intact."
      />
      <CategoryManager />
    </Page>
  );
}
