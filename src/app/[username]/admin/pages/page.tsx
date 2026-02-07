'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PagesAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Manager</CardTitle>
        <CardDescription>
          Create, edit, and manage custom pages for your site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Your custom pages will be listed here.
        </p>
      </CardContent>
    </Card>
  );
}
