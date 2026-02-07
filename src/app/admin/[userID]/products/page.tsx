'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductsAdminPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>পণ্য ব্যবস্থাপনা</CardTitle>
            <CardDescription>
              আপনার দোকানের জন্য পণ্য যোগ, সম্পাদনা এবং পরিচালনা করুন।
            </CardDescription>
        </div>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> নতুন পণ্য যোগ করুন
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          আপনার পণ্য এখানে তালিকাভুক্ত করা হবে।
        </p>
      </CardContent>
    </Card>
  );
}
