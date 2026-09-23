import { PageHeading } from '@/components/finance/blocks';
import { CategoryManager } from '@/components/finance/category-manager';
import styles from '@/components/finance/finance.module.scss';

export default function Page() {
  return (
    <div className={styles.page}>
      <PageHeading
        title="Categories"
        description="Groups carry the colour and whether they are income or expense; categories carry the icon. Archive instead of deleting so history stays intact."
      />
      <CategoryManager />
    </div>
  );
}
