
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { FooterLinkCategory, FooterLink } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

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
        try {
            const response = await fetch('/api/footer/categories/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setCategories(result.categories || []);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching footer data', description: error.message });
        } finally {
            setIsLoading(false);
        }
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
            let endpoint = '';
            let payload = { ...formData, siteId: user.id };

            if (dialog?.type === 'category') {
                endpoint = '/api/footer/categories/save';
                payload.id = dialog.data?.id;
                payload.order = dialog.data ? dialog.data.order : categories.length;
            } else if (dialog?.type === 'link') {
                endpoint = '/api/footer/links/save';
                payload.id = dialog.data?.id;
                payload.categoryId = dialog.categoryId;
                payload.order = dialog.data ? dialog.data.order : 0;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `${dialog?.type === 'category' ? 'Category' : 'Link'} ${dialog?.data ? 'updated' : 'created'}.` });
                setDialog(null);
                await fetchFooterData();
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (type: 'category' | 'link', id: string) => {
        if (!user) return;
        const endpoint = type === 'category' ? '/api/footer/categories/delete' : '/api/footer/links/delete';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, siteId: user.id }),
            });

            if (response.ok) {
                toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted.` });
                await fetchFooterData();
            } else {
                const result = await response.json();
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: `Failed to delete ${type}`, description: error.message });
        }
    };
    
    if (isLoading && categories.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
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
                                        <div className="flex items-center justify-between w-full pr-4 text-left">
                                            <span>{cat.title}</span>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDialog({ type: 'category', data: cat }); }}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete('category', cat.id); }}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-4">
                                        <div className="space-y-2">
                                            {(cat.footer_links || []).length > 0 ? (
                                                cat.footer_links?.map(link => (
                                                    <div key={link.id} className="flex items-center justify-between py-2 border-b">
                                                        <div className="truncate pr-4">
                                                            <p className="font-medium">{link.label}</p>
                                                            <p className="text-xs text-muted-foreground font-mono truncate">{link.href}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'link', data: link, categoryId: cat.id })}><Edit className="h-4 w-4"/></Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete('link', link.id)}><Trash2 className="h-4 w-4"/></Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground py-2 italic">No links in this category.</p>
                                            )}
                                        </div>
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
                        <DialogTitle>{dialog?.data ? 'Edit' : 'Add'} {dialog?.type === 'category' ? 'Category' : 'Link'}</DialogTitle>
                    </DialogHeader>
                    {dialog?.type === 'category' ? (
                        <Form {...catForm}>
                            <form onSubmit={catForm.handleSubmit(handleDialogSubmit)} className="space-y-4 pt-2">
                                <FormField control={catForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Category Title</FormLabel><FormControl><Input placeholder="e.g., Shop" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Category</Button></DialogFooter>
                            </form>
                        </Form>
                    ) : (
                        <Form {...linkForm}>
                            <form onSubmit={linkForm.handleSubmit(handleDialogSubmit)} className="space-y-4 pt-2">
                                <FormField control={linkForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Link Label</FormLabel><FormControl><Input placeholder="e.g., All Products" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={linkForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>Link URL</FormLabel><FormControl><Input placeholder="e.g., /products" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Link</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
