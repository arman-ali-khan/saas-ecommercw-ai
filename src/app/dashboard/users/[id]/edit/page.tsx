
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const editUserSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters."),
    username: z.string().min(3, "Username must be at least 3 characters."),
    site_name: z.string().min(2, "Site name must be at least 2 characters."),
    domain: z.string().min(3, "Domain is too short"),
    site_description: z.string().optional(),
});

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const userId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');

    const form = useForm<z.infer<typeof editUserSchema>>({
        resolver: zodResolver(editUserSchema),
        defaultValues: { full_name: '', username: '', site_name: '', domain: '', site_description: '' }
    });

    const fetchUser = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch('/api/saas/admins/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });
            const result = await response.json();

            if (response.ok && result.user) {
                const user = result.user;
                setEmail(user.email);
                form.reset({
                    full_name: user.full_name,
                    username: user.username,
                    site_name: user.site_name,
                    domain: user.domain,
                    site_description: user.site_description || '',
                });
            } else {
                throw new Error(result.error || 'User not found');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push('/dashboard/users');
        } finally {
            setLoading(false);
        }
    }, [userId, router, toast, form]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const onSubmit = async (values: z.infer<typeof editUserSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/saas/admins/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, id: userId }),
            });
            const result = await response.json();

            if (response.ok) {
                toast({ title: 'User updated successfully!' });
                router.push('/dashboard/users');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" asChild className="-ml-4">
                <Link href="/dashboard/users"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Stores</Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Store Admin</CardTitle>
                    <CardDescription>Update the profile and site details for {email}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="site_name" render={({ field }) => (<FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="domain" render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="site_description" render={({ field }) => (<FormItem><FormLabel>Site Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
