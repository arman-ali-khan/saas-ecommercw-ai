
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Mail, MoreHorizontal, Eye } from 'lucide-react'; // Import Eye icon
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type CustomerProfile = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export default function CustomersAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lang = user?.language || 'bn';
  const t = {
    title: { bn: 'কাস্টমার ম্যানেজমেন্ট', en: 'Customer Management' },
    description: { bn: 'আপনার স্টোরের সব রেজিস্টার্ড কাস্টমারদের লিস্ট।', en: 'List of all registered customers in your store.' },
    totalCustomers: { bn: `মোট ${customers.length} জন কাস্টমার।`, en: `Total ${customers.length} customers.`},
    noCustomers: { bn: 'কোনো রেজিস্টার্ড কাস্টমার পাওয়া যায়নি।', en: 'No registered customers found.' },
    loadingDescription: { bn: 'আপনার স্টোরে রেজিস্টার্ড কাস্টমারদের দেখুন।', en: 'View registered customers in your store.' },
    customer: { bn: 'কাস্টমার', en: 'Customer' },
    email: { bn: 'ইমেল', en: 'Email' },
    registrationDate: { bn: 'রেজিস্ট্রেশন ডেট', en: 'Registration Date' },
    actions: { bn: 'অ্যাকশনস', en: 'Actions' },
    viewDetails: { bn: 'বিস্তারিত', en: 'View Details' },
    sendEmail: { bn: 'ইমেল করুন', en: 'Send Email' },
    registered: { bn: 'রেজিস্টার্ড', en: 'Registered' },
  };

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('customer_profiles')
      .select('id, full_name, email, created_at')
      .eq('site_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching customer data',
        description: error.message,
      });
    } else if (data) {
      setCustomers(data as CustomerProfile[]);
    }
    
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCustomers();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchCustomers]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title[lang]}</CardTitle>
          <CardDescription>
            {t.loadingDescription[lang]}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.title[lang]}</CardTitle>
          <CardDescription>
            {t.description[lang]} {t.totalCustomers[lang]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {t.noCustomers[lang]}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.customer[lang]}</TableHead>
                      <TableHead>{t.email[lang]}</TableHead>
                      <TableHead>{t.registrationDate[lang]}</TableHead>
                      <TableHead className="text-right">{t.actions[lang]}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {customer.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {customer.full_name}
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{format(new Date(customer.created_at), 'PP')}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> {t.viewDetails[lang]}
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                                <a href={`mailto:${customer.email}`}>
                                <Mail className="mr-2 h-4 w-4" /> {t.sendEmail[lang]}
                                </a>
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile View */}
              <div className="grid gap-4 md:hidden">
                {customers.map((customer) => (
                  <Card key={customer.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {customer.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {customer.full_name}
                            </CardTitle>
                            <CardDescription>
                              {customer.email}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="-mt-2 -mr-2"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                               <Link href={`/admin/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> {t.viewDetails[lang]}
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <a href={`mailto:${customer.email}`}>
                                <Mail className="mr-2 h-4 w-4" /> {t.sendEmail[lang]}
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">
                        {t.registered[lang]}: {format(new Date(customer.created_at), 'PP')}
                       </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
