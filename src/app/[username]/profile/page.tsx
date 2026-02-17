
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
import { useTranslation } from '@/hooks/use-translation';

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
  const { customer: user, customerLogout, loading: customerLoading } = useCustomerAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslation();
  const { profile: t_profile } = t;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!customerLoading && user) {
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
    } else if (!customerLoading && !user) {
        setIsLoadingStats(false);
    }
  }, [user, customerLoading, toast]);

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
    toast({ title: t_profile.logout, description: "You have been successfully logged out." });
    router.push(`/login`);
  }

  if (!user) {
    return null; // Layout handles loading/redirect
  }
  
  const quickLinks = [
    { href: `/profile/orders`, label: t_profile.myOrders, description: t_profile.myOrdersDesc, icon: ShoppingBag },
    { href: `/profile/addresses`, label: t_profile.myAddresses, description: t_profile.myAddressesDesc, icon: MapPin },
    { href: `/profile/settings`, label: t_profile.settings, description: t_profile.settingsDesc, icon: SettingsIcon },
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
                    {t_profile.welcome}, {user.full_name}!
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={logout} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t_profile.logout}
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 grid-cols-2">
            <StatCard title={t_profile.totalOrders} value={stats.totalOrders.toString()} icon={ShoppingBag} isLoading={isLoadingStats} />
            <StatCard title={t_profile.totalSpent} value={stats.totalSpent} icon={DollarSign} isLoading={isLoadingStats} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{t_profile.quickLinks}</CardTitle>
                 <CardDescription>Navigate to different parts of your profile quickly.</CardDescription>
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
