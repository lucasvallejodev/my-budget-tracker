import styles from '@/components/finance/finance.module.scss';

export default function Loading() {
  return (
    <div className={styles.page} role="status">
      Loading your finances…
    </div>
  );
}
