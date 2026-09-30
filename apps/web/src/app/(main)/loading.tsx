import { Page, Skeleton, SkeletonText } from '@/components/ui';

export default function Loading() {
  return (
    <Page>
      <Skeleton shape="title" />
      <SkeletonText label="Loading your finances…" lines={1} />
      <Skeleton shape="card" />
      <Skeleton shape="block" />
    </Page>
  );
}
