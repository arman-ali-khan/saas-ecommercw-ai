'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsAdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>
          Manage general store settings, shipping, and payment options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Store settings options will be available here.
        </p>
      </CardContent>
    </Card>
  );
}
