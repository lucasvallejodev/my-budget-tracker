import { CurrencySettings } from '@/components/finance/currency-settings';
import { PageHeading } from '@/components/finance/blocks';
import s from '@/components/finance/finance.module.scss';
export default function Page() {
  return (
    <div className={s.page}>
      <PageHeading
        title="Currencies"
        description="Your primary currency, converted totals and manually maintained exchange rates."
      />
      <CurrencySettings />
    </div>
  );
}
