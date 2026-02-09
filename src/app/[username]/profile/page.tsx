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
import { LogOut, LayoutDashboard, ShoppingBag, DollarSign, Star, MapPin, Settings as SettingsIcon } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAuth } from '@/stores/useCustomerAuth';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function ProfilePage() {
  const { customer: user, customerLogout } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();

  const logout = () => {
    customerLogout();
    toast({ title: 'লগ আউট', description: "আপনি সফলভাবে লগ আউট হয়েছেন।" });
    router.push(`/${username}/login`);
  }

  if (!user) {
    return null; // Layout handles loading/redirect
  }
  
  const quickLinks = [
    { href: `/${username}/profile/orders`, label: 'আমার অর্ডার', description: 'আপনার অর্ডারের ইতিহাস এবং স্ট্যাটাস দেখুন।', icon: ShoppingBag },
    { href: `/${username}/profile/reviews`, label: 'আমার রিভিউ', description: 'আপনার দেওয়া সকল রিভিউ দেখুন।', icon: Star },
    { href: `/${username}/profile/addresses`, label: 'আমার ঠিকানা', description: 'আপনার সংরক্ষিত ঠিকানা পরিচালনা করুন।', icon: MapPin },
    { href: `/${username}/profile/settings`, label: 'সেটিংস', description: 'আপনার অ্যাকাউন্ট সেটিংস পরিচালনা করুন।', icon: SettingsIcon },
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
            <StatCard title="মোট অর্ডার" value="5" icon={ShoppingBag} />
            <StatCard title="মোট খরচ" value="BDT 7,850" icon={DollarSign} />
            <StatCard title="রিভিউ লিখেছেন" value="3" icon={Star} />
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
