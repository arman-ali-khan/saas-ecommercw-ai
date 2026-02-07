'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LiveQuestionsAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Questions</CardTitle>
        <CardDescription>
          Respond to customer questions from your storefront in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Incoming customer questions will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
