import { ReactNode } from 'react';

import { Button } from '../button';
import { EmptyState } from '../empty-state';

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
