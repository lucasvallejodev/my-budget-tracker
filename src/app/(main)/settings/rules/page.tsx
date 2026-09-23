import { RulesSettings } from '@/components/finance/rules-settings';
import { PageHeading } from '@/components/finance/blocks';
import s from '@/components/finance/finance.module.scss';

export default function Page() {
  return (
    <div className={s.page}>
      <PageHeading
        title="Categorisation rules"
        description="Simple text rules that assign a category on import and to existing uncategorised entries."
      />
      <RulesSettings />
    </div>
  );
}
