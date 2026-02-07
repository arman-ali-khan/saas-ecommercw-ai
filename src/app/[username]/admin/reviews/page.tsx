'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ReviewsAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Reviews</CardTitle>
        <CardDescription>
          View, approve, and reply to customer reviews.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Customer reviews will be listed here for moderation.
        </p>
      </CardContent>
    </Card>
  );
}
