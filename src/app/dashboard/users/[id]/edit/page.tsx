'use client';

import { useEffect, useState } from 'react';
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

type UserProfile = {
    id: string;
    username: string;
    full_name: string;
    email: string;
    domain: string;
    site_name: string;
    site_description: string;
};

const editUserSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters."),
    site_name: z.string().min(2, "Site name must be at least 2 characters."),
    site_description: z.string().optional(),
});

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const userId = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof editUserSchema>>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            full_name: '',
            site_name: '',
            site_description: '',
        }
    });

    useEffect(() => {
        if (!userId) return;

        const fetchUser = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                router.push('/dashboard/users');
                return;
            }

            setUser(data as UserProfile);
            form.reset({
                full_name: data.full_name,
                site_name: data.site_name,
                site_description: data.site_description || '',
            });
            setLoading(false);
        };

        fetchUser();
    }, [userId, router, toast, form]);

    const onSubmit = async (values: z.infer<typeof editUserSchema>) => {
        setIsSubmitting(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: values.full_name,
                site_name: values.site_name,
                site_description: values.site_description,
            })
            .eq('id', userId);

        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update user', description: error.message });
        } else {
            toast({ title: 'User updated successfully!' });
            router.push('/dashboard/users');
        }
    };
    
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        )
    }

    if (!user) return null;

    return (
        <div>
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/dashboard/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Stores
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Store: {user.site_name}</CardTitle>
                    <CardDescription>Update the profile and site details for @{user.username}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input value={user.email || 'Not available'} disabled /></FormControl>
                                <FormDescription>User's email address (cannot be changed).</FormDescription>
                            </FormItem>
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="site_name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="site_description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Description</FormLabel>
                                    <FormControl><Textarea {...field} rows={4} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
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
