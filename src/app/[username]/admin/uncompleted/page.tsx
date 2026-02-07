'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function UncompletedOrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uncompleted Orders</CardTitle>
        <CardDescription>
          View and manage orders that were started but not completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Uncompleted orders will be listed here.
        </p>
      </CardContent>
    </Card>
  );
}
