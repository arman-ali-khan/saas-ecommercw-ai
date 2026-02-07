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
import { LogOut, LayoutDashboard, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mock data, in a real app this would come from an API
const orders = [
  { id: 'ORD001', date: '২০২৩-১০-২৬', total: 2150.00, status: 'বিতরণ করা হয়েছে', currency: 'BDT' },
  { id: 'ORD002', date: '২০২৩-১১-১৫', total: 850.00, status: 'প্রক্রিয়াকরণ চলছে', currency: 'BDT' },
  { id: 'ORD003', date: '২০২৩-১২-০১', total: 500.00, status: 'পাঠানো হয়েছে', currency: 'BDT' },
];

const reviews = [
    { id: '1', productName: 'হিমসাগর আম', rating: 5, comment: 'অসাধারণ স্বাদ! একেবারে টাটকা এবং মিষ্টি।', date: '২০২৩-০৬-১৫'},
    { id: '2', productName: 'সুন্দরবনের মধু', rating: 4, comment: 'খুবই খাঁটি মনে হলো, তবে দামটা একটু বেশি।', date: '২০২৩-০৭-২০'},
];


export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'বিতরণ করা হয়েছে':
        return 'default';
      case 'পাঠানো হয়েছে':
        return 'secondary';
      case 'প্রক্রিয়াকরণ চলছে':
        return 'outline';
      default:
        return 'destructive';
    }
  };

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
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
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

        <Card>
            <CardHeader>
                <CardTitle>সাম্প্রতিক অর্ডার</CardTitle>
                <CardDescription>আপনার সাম্প্রতিক অর্ডারের একটি ওভারভিউ।</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>অর্ডার আইডি</TableHead>
                            <TableHead>তারিখ</TableHead>
                            <TableHead>স্ট্যাটাস</TableHead>
                            <TableHead className="text-right">মোট</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{order.total.toFixed(2)} {order.currency}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {orders.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">আপনার কোনো সাম্প্রতিক অর্ডার নেই।</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>আমার রিভিউ</CardTitle>
                <CardDescription>আপনি যে পণ্যগুলির জন্য রিভিউ দিয়েছেন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="border p-4 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{review.productName}</h3>
                                <p className="text-sm text-muted-foreground">{review.date}</p>
                            </div>
                             <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-5 w-5 ${
                                        i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                    </div>
                ))}
                 {reviews.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">আপনি এখনো কোনো রিভিউ দেননি।</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
