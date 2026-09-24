import './pagination.scss';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../button';
import { Cluster } from '../cluster';

export function Pagination({
  itemLabel = 'page',
  label,
  onChange,
  page,
  pages,
  variant = 'text',
}: {
  itemLabel?: string;
  label: string;
  onChange: (page: number) => void;
  page: number;
  pages: number;
  variant?: 'text' | 'compact';
}) {
  const previous = () => onChange(page - 1);
  const next = () => onChange(page + 1);

  if (variant === 'compact') {
    return (
      <nav aria-label={label} className="pagination">
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <Cluster>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Previous ${itemLabel}`}
            disabled={page <= 1}
            onClick={previous}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Next ${itemLabel}`}
            disabled={page >= pages}
            onClick={next}
          >
            <ChevronRight />
          </Button>
        </Cluster>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className="pagination">
      <Button variant="outline" disabled={page <= 1} onClick={previous}>
        Previous
      </Button>
      <span aria-live="polite">
        Page {page} of {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={next}>
        Next
      </Button>
    </nav>
  );
}
