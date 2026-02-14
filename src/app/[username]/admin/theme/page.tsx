
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HeaderLink, FooterLinkCategory, FooterLink, SocialLink } from '@/types';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, ArrowUp, ArrowDown, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Zod Schemas ---
const headerLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  href: z.string().min(1, 'URL is required'),
});

const socialLinkSchema = z.object({
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok']),
  href: z.string().url('A valid URL is required'),
});

const footerCategorySchema = z.object({
  title: z.string().min(1, 'Category title is required'),
});

const footerLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  href: z.string().min(1, 'URL is required'),
});

const socialPlatforms = [
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'tiktok', label: 'TikTok' },
] as const;


export default function ThemePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [headerLinks, setHeaderLinks] = useState<HeaderLink[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [footerCategories, setFooterCategories] = useState<FooterLinkCategory[]>([]);
    
    // --- Dialog States ---
    const [dialogState, setDialogState] = useState<{ type: string | null, data?: any, parentId?: string }>({ type: null });
    const [deleteAlertState, setDeleteAlertState] = useState<{ type: string | null, data?: any }>({ type: null });

    // --- Forms ---
    const headerForm = useForm({ resolver: zodResolver(headerLinkSchema) });
    const socialForm = useForm({ resolver: zodResolver(socialLinkSchema) });
    const footerCatForm = useForm({ resolver: zodResolver(footerCategorySchema) });
    const footerLinkForm = useForm({ resolver: zodResolver(footerLinkSchema) });
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [
                { data: headerData },
                { data: socialData },
                { data: footerCatData },
            ] = await Promise.all([
                supabase.from('header_links').select('*').eq('site_id', user.id).order('order'),
                supabase.from('social_links').select('*').eq('site_id', user.id),
                supabase.from('footer_link_categories').select('*, footer_links(*)').eq('site_id', user.id).order('order'),
            ]);

            setHeaderLinks((headerData as HeaderLink[]) || []);
            setSocialLinks((socialData as SocialLink[]) || []);
            
            const categories = (footerCatData || []).map(cat => ({
                ...cat,
                footer_links: (cat.footer_links || []).sort((a: any, b: any) => a.order - b.order)
            })) as FooterLinkCategory[];

            setFooterCategories(categories);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching theme data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    useEffect(() => {
        if (user && !authLoading) {
            fetchData();
        }
    }, [user, authLoading, fetchData]);

    // --- Form Handling ---
    const handleOpenDialog = (type: string, data: any = null, parentId: string | null = null) => {
        setDialogState({ type, data, parentId: parentId || undefined });
        const formMap: any = { 'headerLink': headerForm, 'socialLink': socialForm, 'footerCategory': footerCatForm, 'footerLink': footerLinkForm };
        formMap[type]?.reset(data || {});
    };

    const handleDialogSubmit = async (formData: any) => {
        if (!user || !dialogState.type) return;
        setIsSubmitting(true);
        
        let error;
        const isEditing = !!dialogState.data;

        try {
            switch(dialogState.type) {
                case 'headerLink':
                    const headerPayload = { ...formData, site_id: user.id, order: isEditing ? dialogState.data.order : headerLinks.length };
                    if (isEditing) {
                        ({ error } = await supabase.from('header_links').update(headerPayload).eq('id', dialogState.data.id));
                    } else {
                        ({ error } = await supabase.from('header_links').insert(headerPayload));
                    }
                    break;
                case 'socialLink':
                    const socialPayload = { ...formData, site_id: user.id };
                    if (isEditing) {
                        ({ error } = await supabase.from('social_links').update(socialPayload).eq('id', dialogState.data.id));
                    } else {
                         ({ error } = await supabase.from('social_links').insert(socialPayload));
                    }
                    break;
                case 'footerCategory':
                    const catPayload = { ...formData, site_id: user.id, order: isEditing ? dialogState.data.order : footerCategories.length };
                    if (isEditing) {
                        ({ error } = await supabase.from('footer_link_categories').update(catPayload).eq('id', dialogState.data.id));
                    } else {
                        ({ error } = await supabase.from('footer_link_categories').insert(catPayload));
                    }
                    break;
                case 'footerLink':
                    const parentCategory = footerCategories.find(c => c.id === dialogState.parentId);
                    const linkPayload = { ...formData, site_id: user.id, category_id: dialogState.parentId, order: isEditing ? dialogState.data.order : (parentCategory?.footer_links?.length || 0) };
                    if (isEditing) {
                        ({ error } = await supabase.from('footer_links').update(linkPayload).eq('id', dialogState.data.id));
                    } else {
                        ({ error } = await supabase.from('footer_links').insert(linkPayload));
                    }
                    break;
            }

            if (error) throw error;
            toast({ title: `${dialogState.type} ${isEditing ? 'updated' : 'created'}!` });
            setDialogState({ type: null });
            await fetchData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: `Failed to save ${dialogState.type}`, description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !deleteAlertState.type || !deleteAlertState.data) return;
        setIsSubmitting(true);
        
        let error;
        try {
            const tableMap: any = { 'headerLink': 'header_links', 'socialLink': 'social_links', 'footerCategory': 'footer_link_categories', 'footerLink': 'footer_links' };
            ({ error } = await supabase.from(tableMap[deleteAlertState.type]).delete().eq('id', deleteAlertState.data.id));

            if (error) throw error;
            toast({ title: `${deleteAlertState.type} deleted.` });
            setDeleteAlertState({ type: null });
            await fetchData();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Reorder ---
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

    const handleFooterLinkReorder = async (catIndex: number, linkIndex: number, direction: 'up' | 'down') => {
        const newCategories = [...footerCategories];
        const category = newCategories[catIndex];
        const links = [...(category.footer_links || [])];
        const newLinkIndex = direction === 'up' ? linkIndex - 1 : linkIndex + 1;
        
        if (newLinkIndex < 0 || newLinkIndex >= links.length) return;
        [links[linkIndex], links[newLinkIndex]] = [links[newLinkIndex], links[linkIndex]];
        
        const updates = links.map((link, idx) => ({ ...link, order: idx }));
        newCategories[catIndex].footer_links = updates;

        setFooterCategories(newCategories); // Optimistic UI update

        const dbUpdates = updates.map(u => ({ id: u.id, order: u.order }));
        const { error } = await supabase.from('footer_links').upsert(dbUpdates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder link', description: error.message });
            await fetchData(); // Revert on error by re-fetching
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
    
    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Theme Manager</h1>
                    <p className="text-muted-foreground">Customize your site's header and footer navigation.</p>
                </div>

                <Accordion type="multiple" defaultValue={['header']} className="w-full space-y-4">
                    <AccordionItem value="header" className="border-b-0">
                        <AccordionTrigger className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg data-[state=open]:rounded-b-none">
                            <span className="font-semibold text-lg">Header Navigation</span>
                        </AccordionTrigger>
                        <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                            <Card className="border-0 shadow-none">
                                <CardContent className="p-6">
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
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="footer" className="border-b-0">
                        <AccordionTrigger className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg data-[state=open]:rounded-b-none">
                            <span className="font-semibold text-lg">Footer Content</span>
                        </AccordionTrigger>
                        <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                        <Card className="border-0 shadow-none">
                            <CardContent className="p-6 space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
                                    <div className="space-y-2">
                                        {socialLinks.map(link => (
                                            <div key={link.id} className="flex items-center gap-4 p-2 border rounded-md">
                                                <div className="flex-grow flex items-center gap-2 font-semibold capitalize">{link.platform}</div>
                                                <p className="text-sm text-muted-foreground truncate">{link.href}</p>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog('socialLink', link)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteAlertState({ type: 'socialLink', data: link })}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button className="mt-4" variant="outline" onClick={() => handleOpenDialog('socialLink')}><Plus className="mr-2 h-4 w-4" /> Add Social Link</Button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Footer Link Columns</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {footerCategories.map((cat, catIndex) => (
                                            <Card key={cat.id}>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">{cat.title}</CardTitle>
                                                    <div>
                                                        <Button variant="ghost" size="icon" disabled={catIndex === 0} onClick={() => handleReorder(footerCategories, setFooterCategories, 'footer_link_categories', catIndex, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" disabled={catIndex === footerCategories.length - 1} onClick={() => handleReorder(footerCategories, setFooterCategories, 'footer_link_categories', catIndex, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog('footerCategory', cat)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteAlertState({ type: 'footerCategory', data: cat })}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-1">
                                                        {(cat.footer_links || []).map((link, linkIndex) => (
                                                            <div key={link.id} className="flex items-center justify-between p-1 rounded hover:bg-muted">
                                                                <p className="text-sm">{link.label}</p>
                                                                <div>
                                                                    <Button variant="ghost" size="icon" disabled={linkIndex === 0} onClick={() => handleFooterLinkReorder(catIndex, linkIndex, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                                                                    <Button variant="ghost" size="icon" disabled={linkIndex === (cat.footer_links?.length || 0) - 1} onClick={() => handleFooterLinkReorder(catIndex, linkIndex, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog('footerLink', link, cat.id)}><Edit className="h-3 w-3" /></Button>
                                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteAlertState({ type: 'footerLink', data: link })}><Trash2 className="h-3 w-3" /></Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => handleOpenDialog('footerLink', null, cat.id)}><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <Button className="mt-4" onClick={() => handleOpenDialog('footerCategory')}><Plus className="mr-2 h-4 w-4" /> Add Footer Column</Button>
                                </div>
                            </CardContent>
                        </Card>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            
            <Dialog open={!!dialogState.type} onOpenChange={() => setDialogState({ type: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogState.data ? 'Edit' : 'Add'} {dialogState.type}</DialogTitle>
                    </DialogHeader>
                    {dialogState.type === 'headerLink' && (
                        <Form {...headerForm}>
                            <form onSubmit={headerForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={headerForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={headerForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
                    {dialogState.type === 'socialLink' && (
                        <Form {...socialForm}>
                            <form onSubmit={socialForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={socialForm.control} name="platform" render={({ field }) => (<FormItem><FormLabel>Platform</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger></FormControl><SelectContent>{socialPlatforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={socialForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
                    {dialogState.type === 'footerCategory' && (
                         <Form {...footerCatForm}>
                            <form onSubmit={footerCatForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={footerCatForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Column Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
                     {dialogState.type === 'footerLink' && (
                         <Form {...footerLinkForm}>
                            <form onSubmit={footerLinkForm.handleSubmit(handleDialogSubmit)} className="space-y-4">
                                <FormField control={footerLinkForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={footerLinkForm.control} name="href" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save</Button></DialogFooter>
                            </form>
                        </Form>
                    )}
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

    