'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Home, Briefcase, Trash2, Edit } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AddressesPage() {
  // Dummy data for now
  const addresses = [
    { id: 1, name: 'বাড়ির ঠিকানা', details: 'বাড়ি #১২, রাস্তা #৩, ধানমন্ডি, ঢাকা', type: 'home' },
    { id: 2, name: 'অফিসের ঠিকানা', details: 'এবিসি টাওয়ার, লেভেল ৫, গুলশান, ঢাকা', type: 'work' },
  ];

  const AddressIcon = ({type}: {type: string}) => {
    if (type === 'home') return <Home className="h-5 w-5 text-muted-foreground" />
    if (type === 'work') return <Briefcase className="h-5 w-5 text-muted-foreground" />
    return null;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold">আমার ঠিকানা</h1>
                <p className="text-muted-foreground">আপনার সংরক্ষিত শিপিং ঠিকানাগুলি পরিচালনা করুন।</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
            </Button>
        </div>

        {addresses.length > 0 ? (
             <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                {addresses.map(address => (
                <Card key={address.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <AddressIcon type={address.type} />
                                <CardTitle>{address.name}</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            এই ঠিকানাটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি বাতিল করা যাবে না।
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                        <AlertDialogAction>মুছে ফেলুন</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{address.details}</p>
                    </CardContent>
                </Card>
                ))}
            </div>
        ) : (
             <Card>
                <CardContent className="text-center py-16">
                    <p className="text-muted-foreground">আপনার কোনো সংরক্ষিত ঠিকানা নেই।</p>
                     <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
