
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FooterLinkCategory, FooterLink } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const categorySchema = z.object({ title: z.string().min(1, 'Title is required') });
const linkSchema = z.object({ label: z.string().min(1, 'Label is required'), href: z.string().min(1, 'URL is required') });

export default function FooterManagerPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<FooterLinkCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialog, setDialog] = useState<{ type: 'category' | 'link'; data?: any; categoryId?: string } | null>(null);

    const catForm = useForm({ resolver: zodResolver(categorySchema) });
    const linkForm = useForm({ resolver: zodResolver(linkSchema) });

    const fetchFooterData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('footer_link_categories')
            .select('*, footer_links(*)')
            .eq('site_id', user.id)
            .order('order');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching footer data', description: error.message });
        } else {
            setCategories((data as any[]) || []);
        }
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (user && !authLoading) fetchFooterData();
    }, [user, authLoading, fetchFooterData]);

    useEffect(() => {
        if (dialog) {
            if (dialog.type === 'category') catForm.reset(dialog.data || { title: '' });
            if (dialog.type === 'link') linkForm.reset(dialog.data || { label: '', href: '' });
        }
    }, [dialog, catForm, linkForm]);

    const handleDialogSubmit = async (formData: any) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            if (dialog?.type === 'category') {
                const payload = { ...formData, site_id: user.id, order: dialog.data ? dialog.data.order : categories.length };
                const { error } = dialog.data
                    ? await supabase.from('footer_link_categories').update(payload).eq('id', dialog.data.id)
                    : await supabase.from('footer_link_categories').insert(payload);
                if (error) throw error;
                toast({ title: `Category ${dialog.data ? 'updated' : 'created'}.` });
            } else if (dialog?.type === 'link') {
                const payload = { ...formData, site_id: user.id, category_id: dialog.categoryId, order: dialog.data ? dialog.data.order : 0 };
                const { error } = dialog.data
                    ? await supabase.from('footer_links').update(payload).eq('id', dialog.data.id)
                    : await supabase.from('footer_links').insert(payload);
                if (error) throw error;
                toast({ title: `Link ${dialog.data ? 'updated' : 'created'}.` });
            }
            setDialog(null);
            await fetchFooterData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: e.message });
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (type: 'category' | 'link', id: string) => {
        const table = type === 'category' ? 'footer_link_categories' : 'footer_links';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: `Failed to delete ${type}`, description: error.message });
        } else {
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted.` });
            await fetchFooterData();
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Footer Manager</CardTitle>
                    <CardDescription>Manage the link categories and links in your site's footer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="mb-4" onClick={() => setDialog({ type: 'category' })}><Plus className="mr-2 h-4 w-4"/> Add Category</Button>
                    {categories.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {categories.map(cat => (
                                <AccordionItem value={cat.id} key={cat.id}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span>{cat.title}</span>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDialog({ type: 'category', data: cat }); }}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete('category', cat.id); }}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-4">
                                        {(cat.footer_links || []).map(link => (
                                            <div key={link.id} className="flex items-center justify-between py-2 border-b">
                                                <div>
                                                    <p className="font-medium">{link.label}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{link.href}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'link', data: link, categoryId: cat.id })}><Edit className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete('link', link.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                        ))}
                                        <Button className="mt-4" size="sm" variant="secondary" onClick={() => setDialog({ type: 'link', categoryId: cat.id })}><Plus className="mr-2 h-4 w-4"/> Add Link</Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">No footer link categories yet.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialog?.data ? 'Edit' : 'Add'} {dialog?.type}</DialogTitle>
                    </DialogHeader>
                    {dialog?.type === 'category' ? (
                        <Form {...catForm}>
                            <form onSubmit={catForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={catForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Category Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    ) : (
                        <Form {...linkForm}>
                            <form onSubmit={linkForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={linkForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Link Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={linkForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>Link URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

    