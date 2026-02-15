'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HeaderLink } from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function ThemePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [headerLinks, setHeaderLinks] = useState<HeaderLink[]>([]);
    
    const [dialogState, setDialogState] = useState<{ type: string | null, data?: any }>({ type: null });
    const [deleteAlertState, setDeleteAlertState] = useState<{ type: string | null, data?: any }>({ type: null });

    const headerForm = useForm({ resolver: zodResolver(headerLinkSchema) });
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: headerData } = await supabase.from('header_links').select('*').eq('site_id', user.id).order('order');
            setHeaderLinks((headerData as HeaderLink[]) || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching header data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    useEffect(() => {
        if (user && !authLoading) {
            fetchData();
        }
    }, [user, authLoading, fetchData]);

    const handleOpenDialog = (type: string, data: any = null) => {
        setDialogState({ type, data });
        headerForm.reset(data || {});
    };

    const handleDialogSubmit = async (formData: any) => {
        if (!user || !dialogState.type) return;
        setIsSubmitting(true);
        
        let error;
        const isEditing = !!dialogState.data;

        try {
            const headerPayload = { ...formData, site_id: user.id, order: isEditing ? dialogState.data.order : headerLinks.length };
            if (isEditing) {
                ({ error } = await supabase.from('header_links').update(headerPayload).eq('id', dialogState.data.id));
            } else {
                ({ error } = await supabase.from('header_links').insert(headerPayload));
            }
            if (error) throw error;
            toast({ title: `Header Link ${isEditing ? 'updated' : 'created'}!` });
            setDialogState({ type: null });
            await fetchData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: `Failed to save Header Link`, description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !deleteAlertState.type || !deleteAlertState.data) return;
        setIsSubmitting(true);
        
        let error;
        try {
            ({ error } = await supabase.from('header_links').delete().eq('id', deleteAlertState.data.id));

            if (error) throw error;
            toast({ title: `Header Link deleted.` });
            setDeleteAlertState({ type: null });
            await fetchData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReorder = async (list: any[], setList: Function, table: string, index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= list.length) return;
        
        const newList = [...list];
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]]; // Swap
        
        const updates = newList.map((item, idx) => ({ id: item.id, order: idx }));
        
        setList(newList); // Optimistic update
        const { error } = await supabase.from(table).upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder', description: error.message });
            setList(list); // Revert on error
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Header Navigation</CardTitle>
                    <CardDescription>Manage the main navigation links in your site's header.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>URL</TableHead><TableHead className="text-right w-36">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {headerLinks.map((link, index) => (
                                <TableRow key={link.id}>
                                    <TableCell>{link.label}</TableCell>
                                    <TableCell className="font-mono text-xs">{link.href}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => handleReorder(headerLinks, setHeaderLinks, 'header_links', index, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" disabled={index === headerLinks.length - 1} onClick={() => handleReorder(headerLinks, setHeaderLinks, 'header_links', index, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog('headerLink', link)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteAlertState({ type: 'headerLink', data: link })}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button className="mt-4" onClick={() => handleOpenDialog('headerLink')}><Plus className="mr-2 h-4 w-4" /> Add Header Link</Button>
                </CardContent>
            </Card>

            <Dialog open={dialogState.type === 'headerLink'} onOpenChange={() => setDialogState({ type: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogState.data ? 'Edit' : 'Add'} Header Link</DialogTitle>
                    </DialogHeader>
                    <Form {...headerForm}>
                        <form onSubmit={headerForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                            <FormField control={headerForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={headerForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteAlertState.type} onOpenChange={() => setDeleteAlertState({ type: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the item. This action cannot be undone.</AlertDialogDescription>
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
