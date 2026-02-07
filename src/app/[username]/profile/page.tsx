'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, LayoutDashboard } from 'lucide-react';


export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className='space-y-2'>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-56" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-3xl">
                    <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl font-bold">
                    স্বাগতম, {user.fullName}!
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                এটি আপনার ব্যক্তিগত ড্যাশবোর্ড। এখান থেকে আপনি আপনার দোকান এবং
                অ্যাকাউন্ট পরিচালনা করতে পারেন। শুরু করতে বাম পাশের মেনু ব্যবহার করুন।
                </p>
                <div className="flex gap-4">
                <Button asChild>
                    <Link href={`/${user.domain}/admin`}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    অ্যাডমিন ড্যাশবোর্ডে যান
                    </Link>
                </Button>
                <Button onClick={logout} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    লগআউট
                </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>দ্রুত কার্যক্রম</CardTitle>
                 <CardDescription>আপনার সাম্প্রতিক কার্যক্রমের একটি দ্রুত লিঙ্ক।</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <Link href={`/${user.domain}/profile/orders`} className="block">
                    <div className="p-4 border rounded-lg hover:bg-muted">
                        <h3 className="font-semibold text-lg">আমার অর্ডার</h3>
                        <p className="text-muted-foreground text-sm">আপনার অর্ডারের ইতিহাস এবং স্ট্যাটাস দেখুন।</p>
                    </div>
                </Link>
                <Link href={`/${user.domain}/profile/reviews`} className="block">
                     <div className="p-4 border rounded-lg hover:bg-muted">
                        <h3 className="font-semibold text-lg">আমার রিভিউ</h3>
                        <p className="text-muted-foreground text-sm">আপনার দেওয়া সকল রিভিউ দেখুন।</p>
                    </div>
                </Link>
                <Link href={`/${user.domain}/profile/addresses`} className="block">
                     <div className="p-4 border rounded-lg hover:bg-muted">
                        <h3 className="font-semibold text-lg">আমার ঠিকানা</h3>
                        <p className="text-muted-foreground text-sm">আপনার সংরক্ষিত ঠিকানা পরিচালনা করুন।</p>
                    </div>
                </Link>
                 <Link href={`/${user.domain}/profile/settings`} className="block">
                     <div className="p-4 border rounded-lg hover:bg-muted">
                        <h3 className="font-semibold text-lg">সেটিংস</h3>
                        <p className="text-muted-foreground text-sm">আপনার অ্যাকাউন্ট সেটিংস পরিচালনা করুন।</p>
                    </div>
                </Link>
            </CardContent>
        </Card>

    </div>
  );
}
