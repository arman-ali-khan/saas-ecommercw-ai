'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, LayoutDashboard } from 'lucide-react';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.name !== params.username) {
        router.replace(`/${user.name}/profile`);
      }
    }
  }, [user, isLoading, router, params.username]);

  if (isLoading || !user || user.name !== params.username) {
    return (
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-40 mt-4" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 text-4xl">
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold mt-4">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            এটি আপনার প্রোফাইল পৃষ্ঠা। আপনার স্টোর পরিচালনা করতে ড্যাশবোর্ডে যান।
          </p>
          <Button asChild className="w-full">
            <Link href={`/${user.name}/admin`}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              আপনার ড্যাশবোর্ডে যান
            </Link>
          </Button>
          <Button onClick={logout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            লগআউট
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
