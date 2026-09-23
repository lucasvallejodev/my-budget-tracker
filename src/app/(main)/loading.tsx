import s from '@/components/finance/finance.module.scss';

export default function Loading() {
  return (
    <div className={s.page} role="status">
      Loading your finances…
    </div>
  );
}
