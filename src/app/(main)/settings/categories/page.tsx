import { CategoryManager } from '@/components/finance/category-manager';
import { PageHeading } from '@/components/finance/blocks';
import s from '@/components/finance/finance.module.scss';

export default function Page() {
  return (
    <div className={s.page}>
      <PageHeading
        title="Categories"
        description="Groups carry the colour and whether they are income or expense; categories carry the icon. Archive instead of deleting so history stays intact."
      />
      <CategoryManager />
    </div>
  );
}
