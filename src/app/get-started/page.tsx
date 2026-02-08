import { Suspense } from 'react';
import GetStartedFlow from '@/components/get-started/GetStartedFlow';
import { Skeleton } from '@/components/ui/skeleton';

function GetStartedLoading() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-full max-w-lg mx-auto" />
        <div className="mt-12">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  return (
    <Suspense fallback={<GetStartedLoading />}>
      <GetStartedFlow />
    </Suspense>
  );
}
