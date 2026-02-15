
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HeaderLink } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const headerLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  href: z.string().min(1, 'URL is required'),
});

type HeaderLinkFormData = z.infer<typeof headerLinkSchema>;

export default function HeaderManagerPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [links, setLinks] = useState<HeaderLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedLink, setSelectedLink] = useState<HeaderLink | null>(null);

    const form = useForm<HeaderLinkFormData>({ resolver: zodResolver(headerLinkSchema) });
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase.from('header_links').select('*').eq('site_id', user.id).order('order');
        if(error) {
            toast({ variant: 'destructive', title: 'Error fetching header links', description: error.message });
        } else {
            setLinks((data as HeaderLink[]) || []);
        }
        setIsLoading(false);
    }, [user, toast]);
    
    useEffect(() => {
        if (user && !authLoading) {
            fetchData();
        }
    }, [user, authLoading, fetchData]);

    useEffect(() => {
        if (isFormOpen) {
            form.reset(selectedLink || { label: '', href: '' });
        }
    }, [isFormOpen, selectedLink, form]);

    const handleOpenDialog = (data: HeaderLink | null = null) => {
        setSelectedLink(data);
        setIsFormOpen(true);
    };

    const handleDialogSubmit = async (formData: HeaderLinkFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        
        let error;
        const isEditing = !!selectedLink;

        try {
            const payload = { ...formData, site_id: user.id, order: isEditing ? selectedLink.order : links.length };
            if (isEditing) {
                ({ error } = await supabase.from('header_links').update(payload).eq('id', selectedLink.id));
            } else {
                ({ error } = await supabase.from('header_links').insert(payload));
            }
            if (error) throw error;
            toast({ title: `Link ${isEditing ? 'updated' : 'created'}!` });
            setIsFormOpen(false);
            await fetchData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to save link', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedLink) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('header_links').delete().eq('id', selectedLink.id);
        if (error) {
            toast({ title: 'Error Deleting Link', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Link deleted.' });
            await fetchData();
        }
        setIsSubmitting(false);
        setIsAlertOpen(false);
    };
    
    const handleReorder = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= links.length) return;
        
        const newList = [...links];
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
        
        const updates = newList.map((item, idx) => ({ id: item.id, order: idx }));
        
        setLinks(newList);
        const { error } = await supabase.from('header_links').upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder', description: error.message });
            setLinks(links); // Revert
        } else {
            toast({ title: 'Order updated' });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Header Manager</CardTitle>
                    <CardDescription>Manage the main navigation links in your site's header.</CardDescription>
                </CardHeader>
                 <CardContent>
                    {links.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>URL</TableHead><TableHead className="text-right w-36">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {links.map((link, index) => (
                                    <TableRow key={link.id}>
                                        <TableCell>{link.label}</TableCell>
                                        <TableCell className="font-mono text-xs">{link.href}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => handleReorder(index, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" disabled={index === links.length - 1} onClick={() => handleReorder(index, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(link)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setSelectedLink(link); setIsAlertOpen(true);}}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">No header links yet.</p>
                    )}
                    <Button className="mt-4" onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLink ? 'Edit' : 'Add'} Header Link</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleDialogSubmit)} className="space-y-4">
                            <FormField control={form.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="href" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{selectedLink?.label}". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    