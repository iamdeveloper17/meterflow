import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-32 w-full mt-8" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}