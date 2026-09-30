import './skeleton.scss';

import { cn } from '@/lib/styles';

export type SkeletonShape = 'block' | 'card' | 'line' | 'title';

const ShapeClassNames: Record<SkeletonShape, string> = {
  block: 'skeleton--block',
  card: 'skeleton--card',
  line: '',
  title: 'skeleton--title',
};

const DefaultLines = 3;

export function Skeleton({ shape = 'line' }: { shape?: SkeletonShape }) {
  return <span className={cn('skeleton', ShapeClassNames[shape])} aria-hidden />;
}

export function SkeletonText({ label, lines = DefaultLines }: { label: string; lines?: number }) {
  return (
    <div className="skeleton__group" role="status">
      <span className="skeleton__label">{label}</span>
      {Array.from({ length: lines }, (_unused, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
}
