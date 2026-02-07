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
      <Card>
        <CardHeader className="items-center text-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-40 mt-4" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-1/2 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-3xl">
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">
              স্বাগতম, {user.name}!
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
            <Link href={`/${user.name}/admin`}>
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
  );
}
