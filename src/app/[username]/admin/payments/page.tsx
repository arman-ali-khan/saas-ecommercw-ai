'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PaymentsAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>
          View all transaction history and manage payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Payment details will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}
