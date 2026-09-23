import { PageHeading } from '@/components/finance/blocks';
import styles from '@/components/finance/finance.module.scss';
import { RulesSettings } from '@/components/finance/rules-settings';

export default function Page() {
  return (
    <div className={styles.page}>
      <PageHeading
        title="Categorisation rules"
        description="Simple text rules that assign a category on import and to existing uncategorised entries."
      />
      <RulesSettings />
    </div>
  );
}
