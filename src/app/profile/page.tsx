'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
             <Skeleton className="h-24 w-24 rounded-full" />
             <Skeleton className="h-8 w-40 mt-4" />
             <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="text-center">
             <Skeleton className="h-10 w-full mt-4" />
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
        <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">This is your profile page. More features coming soon!</p>
            <Button onClick={logout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
