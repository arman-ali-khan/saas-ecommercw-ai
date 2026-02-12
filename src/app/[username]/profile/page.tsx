'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, ShoppingBag, DollarSign, Star, MapPin, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: string, icon: React.ElementType, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <div className="h-7 w-24 bg-muted animate-pulse rounded-md" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export default function ProfilePage() {
  const { customer: user, customerLogout, _hasHydrated } = useCustomerAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (_hasHydrated && user) {
        setIsLoadingStats(true);
        supabase.from('orders').select('*').eq('customer_id', user.id)
            .then(({ data, error }) => {
                if (error) {
                    toast({ variant: 'destructive', title: 'Error fetching stats', description: error.message });
                } else {
                    setOrders(data as Order[]);
                }
                setIsLoadingStats(false);
            });
    }
  }, [user, _hasHydrated, toast]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((acc, order) => acc + (order.status !== 'canceled' ? order.total : 0), 0);
    const totalOrders = orders.filter(o => o.status !== 'canceled').length;
    return {
        totalOrders,
        totalSpent: `৳ ${totalSpent.toFixed(2)}`,
    }
  }, [orders]);


  const logout = () => {
    customerLogout();
    toast({ title: 'লগ আউট', description: "আপনি সফলভাবে লগ আউট হয়েছেন।" });
    router.push(`/login`);
  }

  if (!user) {
    return null; // Layout handles loading/redirect
  }
  
  const quickLinks = [
    { href: `/profile/orders`, label: 'আমার অর্ডার', description: 'আপনার অর্ডারের ইতিহাস এবং স্ট্যাটাস দেখুন।', icon: ShoppingBag },
    { href: `/profile/reviews`, label: 'আমার রিভিউ', description: 'আপনার দেওয়া সকল রিভিউ দেখুন।', icon: Star },
    { href: `/profile/addresses`, label: 'আমার ঠিকানা', description: 'আপনার সংরক্ষিত ঠিকানা পরিচালনা করুন।', icon: MapPin },
    { href: `/profile/settings`, label: 'সেটিংস', description: 'আপনার অ্যাকাউন্ট সেটিংস পরিচালনা করুন।', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-3xl">
                    <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold">
                    স্বাগতম, {user.full_name}!
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={logout} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    লগআউট
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="মোট অর্ডার" value={stats.totalOrders.toString()} icon={ShoppingBag} isLoading={isLoadingStats} />
            <StatCard title="মোট খরচ" value={stats.totalSpent} icon={DollarSign} isLoading={isLoadingStats} />
            <StatCard title="রিভিউ লিখেছেন" value="3" icon={Star} isLoading={isLoadingStats} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>দ্রুত কার্যক্রম</CardTitle>
                 <CardDescription>আপনার প্রোফাইলের বিভিন্ন অংশে দ্রুত নেভিগেট করুন।</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                {quickLinks.map(link => (
                     <Link key={link.href} href={link.href} className="block group">
                         <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted transition-colors">
                            <div className="bg-muted p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground">
                                <link.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">{link.label}</h3>
                                <p className="text-muted-foreground text-sm">{link.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
