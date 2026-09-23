import { ArrowUpRight, CircleCheck, Info, Wallet, Zap } from 'lucide-react';
import { ReactNode } from 'react';

import { PERCENT_SCALE } from '@/constants/money';
import { getPercentage } from '@/lib/math';
import { cn } from '@/lib/styles';

import { Button } from '../primitives/button';
import styles from './finance.module.scss';

export const money = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    currency,
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(amount);

export function PageHeading({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <header className={styles.heading}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

export function Panel({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className={cn(styles.panel, className)}>
      {title && (
        <div className={styles.panelHead}>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  detail,
  icon = <Wallet size={20} />,
  label,
  negative,
  trend,
  value,
}: {
  detail?: string;
  icon?: ReactNode;
  label: string;
  negative?: boolean;
  trend?: string;
  value: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.metricLabel}>
        <span className={styles.metricIcon}>{icon}</span>
        {label}
      </div>
      <div className={styles.metricValue}>{value}</div>
      {(trend || detail) && (
        <p className={styles.trend}>
          <span className={negative ? styles.negative : styles.positive}>{trend}</span>
          {detail}
        </p>
      )}
    </section>
  );
}

export function BalanceCard({
  actions,
  amount,
  currency = 'USD',
}: {
  actions?: ReactNode;
  amount: number;
  currency?: string;
}) {
  return (
    <section className={styles.balance}>
      <div className={styles.balanceTitle}>
        <h2>Total balance</h2>
        <span>{currency}</span>
      </div>
      <div>
        <p className={styles.muted}>Available to use</p>
        <div className={styles.metricValue}>{money(amount, currency)}</div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}

export function StatusBadge({
  children,
  tone = 'success',
}: {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  return (
    <span className={cn(styles.badge, styles[tone])}>
      <span aria-hidden="true">•</span>
      {children}
    </span>
  );
}

export function BudgetProgress({
  format = money,
  label = 'Budget progress',
  limit,
  spent,
}: {
  format?: (value: number) => string;
  label?: string;
  limit: number;
  spent: number;
}) {
  const percent = getPercentage(spent, limit);

  return (
    <div>
      <div className={styles.budgetMeta}>
        <span>{percent}% used</span>
        <span>{format(Math.max(0, limit - spent))} remaining</span>
      </div>
      <progress
        className={styles.progress}
        max={PERCENT_SCALE}
        value={Math.min(PERCENT_SCALE, Math.max(0, percent))}
        aria-label={label}
      />
    </div>
  );
}

export function BudgetInsights({ insights }: { insights: string[] }) {
  return (
    <Panel title="Budget Insights">
      <ul className={styles.insights}>
        {insights.map((text, index) => (
          <li key={text}>
            {index === 0 ? <Info size={18} /> : <CircleCheck size={18} />}
            {text}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PromotionPanel({
  actionLabel,
  description,
  href,
  title,
}: {
  actionLabel: string;
  description: string;
  href: string;
  title: string;
}) {
  return (
    <aside className={styles.promotion}>
      <h3>
        <Zap size={18} /> {title}
      </h3>
      <p>{description}</p>
      <Button asChild variant="secondary">
        <a href={href}>
          {actionLabel}
          <ArrowUpRight size={16} />
        </a>
      </Button>
    </aside>
  );
}

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className={styles.empty}>
      <Wallet size={30} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function LinkedAccount({
  actions,
  detail,
  name,
}: {
  actions?: ReactNode;
  detail: string;
  name: string;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.actions}>
        <span className={styles.metricIcon}>
          <Wallet size={20} />
        </span>
        <div>
          <h3>{name}</h3>
          <p>{detail}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}

export function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className={styles.section}>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function QueryContent({
  children,
  empty,
  error,
  errorTitle,
  loading,
  onRetry,
  pending,
}: {
  children: () => ReactNode;
  empty?: ReactNode;
  error?: boolean;
  errorTitle?: string;
  loading: string;
  onRetry?: () => void;
  pending: boolean;
}) {
  if (pending) return <p role="status">{loading}</p>;

  if (error) {
    return (
      <EmptyState
        title={errorTitle ?? 'Something went wrong'}
        action={onRetry && <Button onClick={onRetry}>Try again</Button>}
      />
    );
  }

  if (empty) return <>{empty}</>;

  return <>{children()}</>;
}

const NearLimitRatio = 0.8;

export const budgetStatus = (
  ratio: number
): { label: string; tone: 'danger' | 'warning' | 'success' } => {
  if (ratio >= 1) return { label: 'Exceeded', tone: 'danger' };
  if (ratio >= NearLimitRatio) return { label: 'Near limit', tone: 'warning' };

  return { label: 'On track', tone: 'success' };
};
