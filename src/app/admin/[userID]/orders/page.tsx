'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function OrdersAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>অর্ডার ব্যবস্থাপনা</CardTitle>
        <CardDescription>
          সমস্ত গ্রাহকের অর্ডার দেখুন এবং পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          গ্রাহকদের অর্ডার এখানে তালিকাভুক্ত করা হবে।
        </p>
      </CardContent>
    </Card>
  );
}
