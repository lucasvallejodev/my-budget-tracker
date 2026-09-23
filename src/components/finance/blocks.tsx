import { getPercentage } from '@/lib/math';
import { ReactNode } from 'react';
import { ArrowUpRight, CircleCheck, Info, Wallet, Zap } from 'lucide-react';
import { Button } from '../primitives/button';
import { cn } from '@/lib/styles';
import s from './finance.module.scss';

/** Formats a major-unit number (sample data, budget previews). Ledger amounts use `Amount`. */
export const money = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={s.heading}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(s.panel, className)}>
      {title && (
        <div className={s.panelHead}>
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
  label,
  value,
  icon = <Wallet size={20} />,
  trend,
  detail,
  negative,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: string;
  detail?: string;
  negative?: boolean;
}) {
  return (
    <section className={s.panel}>
      <div className={s.metricLabel}>
        <span className={s.metricIcon}>{icon}</span>
        {label}
      </div>
      <div className={s.metricValue}>{value}</div>
      {(trend || detail) && (
        <p className={s.trend}>
          <span className={negative ? s.negative : s.positive}>{trend}</span>
          {detail}
        </p>
      )}
    </section>
  );
}

export function BalanceCard({
  amount,
  currency = 'USD',
  actions,
}: {
  amount: number;
  currency?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={s.balance}>
      <div className={s.balanceTitle}>
        <h2>Total balance</h2>
        <span>{currency}</span>
      </div>
      <div>
        <p className={s.muted}>Available to use</p>
        <div className={s.metricValue}>{money(amount, currency)}</div>
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
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
    <span className={cn(s.badge, s[tone])}>
      <span aria-hidden="true">•</span>
      {children}
    </span>
  );
}

export function BudgetProgress({
  spent,
  limit,
  label = 'Budget progress',
  format = money,
}: {
  spent: number;
  limit: number;
  label?: string;
  format?: (value: number) => string;
}) {
  const percent = getPercentage(spent, limit);

  return (
    <div>
      <div className={s.budgetMeta}>
        <span>{percent}% used</span>
        <span>{format(Math.max(0, limit - spent))} remaining</span>
      </div>
      <progress
        className={s.progress}
        max={100}
        value={Math.min(100, Math.max(0, percent))}
        aria-label={label}
      />
    </div>
  );
}

export function CategoryBudget({
  name,
  spent,
  limit,
  actions,
}: {
  name: string;
  spent: number;
  limit: number;
  actions?: ReactNode;
}) {
  const ratio = limit > 0 ? spent / limit : 0;

  return (
    <article className={s.budget}>
      <div className={s.balanceTitle}>
        <div>
          <h3>{name}</h3>
          <p className={s.muted}>
            Budget: {money(limit)} · Spent: {money(spent)}
          </p>
        </div>
        <StatusBadge tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'success'}>
          {ratio >= 1 ? 'Exceeded' : ratio >= 0.8 ? 'Near limit' : 'Safe'}
        </StatusBadge>
      </div>
      <BudgetProgress spent={spent} limit={limit} label={`${name} budget`} />
      {actions && <div className={s.budgetActions}>{actions}</div>}
    </article>
  );
}

export function BudgetInsights({ insights }: { insights: string[] }) {
  return (
    <Panel title="Budget Insights">
      <ul className={s.insights}>
        {insights.map((text, i) => (
          <li key={text}>
            {i === 0 ? <Info size={18} /> : <CircleCheck size={18} />}
            {text}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PromotionPanel({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <aside className={s.promotion}>
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
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <Wallet size={30} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function LinkedAccount({
  name,
  detail,
  actions,
}: {
  name: string;
  detail: string;
  actions?: ReactNode;
}) {
  return (
    <div className={s.row}>
      <div className={s.actions}>
        <span className={s.metricIcon}>
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
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={s.section}>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
