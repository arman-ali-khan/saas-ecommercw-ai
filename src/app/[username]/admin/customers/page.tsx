'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
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
import { Loader2, Mail, MoreHorizontal, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };

export default function CustomersAdminPage() {
  const { user } = useAuth();
  const { customers, setCustomers } = useAdminStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const lang = user?.language || 'bn';
  const t = translations[lang].customers;

  const fetchCustomers = useCallback(async (force = false) => {
    if (!user) return;
    
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.customers < 300000;
    if (!force && store.customers.length > 0 && isFresh) return;

    setIsLoading(true);
    try {
        const response = await fetch('/api/customers/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        if (response.ok) {
            setCustomers(result.customers || []);
        } else {
            throw new Error(result.error || 'Failed to fetch customers');
        }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching customer data',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }, [user, setCustomers, toast]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user, fetchCustomers]);

  if (isLoading && customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.loadingDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description} {t.totalCustomers.replace('{count}', customers.length.toString())}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t.noCustomers}</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.customer}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.registrationDate}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{customer.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        {customer.full_name}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{format(new Date(customer.created_at), 'PP')}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/customers/${customer.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> {t.viewDetails}
                              </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                              <a href={`mailto:${customer.email}`}>
                              <Mail className="mr-2 h-4 w-4" /> {t.sendEmail}
                              </a>
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 md:hidden">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{customer.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{customer.full_name}</CardTitle>
                          <CardDescription>{customer.email}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/admin/customers/${customer.id}`}><Eye className="mr-2 h-4 w-4" /> {t.viewDetails}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                             <a href={`mailto:${customer.email}`}><Mail className="mr-2 h-4 w-4" /> {t.sendEmail}</a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground">{t.registered}: {format(new Date(customer.created_at), 'PP')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
