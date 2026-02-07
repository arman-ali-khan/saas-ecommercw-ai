'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function AddressesPage() {
  // Dummy data for now
  const addresses = [
    { id: 1, name: 'বাড়ির ঠিকানা', details: 'বাড়ি #১২, রাস্তা #৩, ধানমন্ডি, ঢাকা' },
    { id: 2, name: 'অফিসের ঠিকানা', details: 'এবিসি টাওয়ার, লেভেল ৫, গুলশান, ঢাকা' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>আমার ঠিকানা</CardTitle>
            <CardDescription>আপনার সংরক্ষিত শিপিং ঠিকানাগুলি পরিচালনা করুন।</CardDescription>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.map(address => (
          <div key={address.id} className="border p-4 rounded-md flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{address.name}</h3>
              <p className="text-muted-foreground">{address.details}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">সম্পাদনা</Button>
              <Button variant="destructive" size="sm">মুছুন</Button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
            <p className="text-muted-foreground text-center py-8">আপনার কোনো সংরক্ষিত ঠিকানা নেই।</p>
        )}
      </CardContent>
    </Card>
  );
}
