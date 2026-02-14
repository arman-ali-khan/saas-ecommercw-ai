
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HeaderLink, FooterLinkCategory, FooterLink, SocialLink } from '@/types';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Facebook, Twitter, Instagram, Youtube, Linkedin, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

    const [headerLinks, setHeaderLinks] = useState<HeaderLink[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [footerCategories, setFooterCategories] = useState<FooterLinkCategory[]>([]);
    
    // State for dialogs
    const [dialogState, setDialogState] = useState<{ type: string | null, data?: any }>({ type: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
                links: cat.footer_links.sort((a: FooterLink, b: FooterLink) => a.order - b.order)
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

    // Reorder handler
    const handleReorder = async (list: any[], setList: Function, table: string, index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= list.length) return;
        
        const newList = [...list];
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]]; // Swap
        
        const updates = newList.map((item, idx) => ({ id: item.id, order: idx }));
        
        setList(newList.map((item, idx) => ({ ...item, order: idx }))); // Optimistic update

        const { error } = await supabase.from(table).upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder', description: error.message });
            setList(list); // Revert on error
        }
    };
    
    if (isLoading) {
        return <div><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Theme Manager</h1>
                <p className="text-muted-foreground">Customize your site's header and footer navigation.</p>
            </div>

            <Accordion type="multiple" defaultValue={['header']} className="w-full space-y-4">
                {/* Header Links Manager */}
                <AccordionItem value="header" className="border-b-0">
                    <AccordionTrigger className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg data-[state=open]:rounded-b-none">
                        <span className="font-semibold text-lg">Header Navigation</span>
                    </AccordionTrigger>
                    <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                        <Card className="border-0 shadow-none">
                            <CardContent className="p-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Label</TableHead>
                                            <TableHead>URL</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {headerLinks.map((link, index) => (
                                            <TableRow key={link.id}>
                                                <TableCell>{link.label}</TableCell>
                                                <TableCell className="font-mono text-xs">{link.href}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => handleReorder(headerLinks, setHeaderLinks, 'header_links', index, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" disabled={index === headerLinks.length - 1} onClick={() => handleReorder(headerLinks, setHeaderLinks, 'header_links', index, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                 <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Add Header Link</Button>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                 {/* Footer Manager */}
                <AccordionItem value="footer" className="border-b-0">
                    <AccordionTrigger className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg data-[state=open]:rounded-b-none">
                        <span className="font-semibold text-lg">Footer Content</span>
                    </AccordionTrigger>
                    <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                       <Card className="border-0 shadow-none">
                           <CardContent className="p-6 space-y-8">
                                {/* Social Links */}
                               <div>
                                    <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
                                    <div className="space-y-2">
                                        {socialLinks.map(link => (
                                            <div key={link.id} className="flex items-center gap-4 p-2 border rounded-md">
                                                <div className="flex-grow flex items-center gap-2">
                                                    <span className="font-semibold capitalize">{link.platform}</span>
                                                    <p className="text-sm text-muted-foreground truncate">{link.href}</p>
                                                </div>
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button className="mt-4" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Social Link</Button>
                               </div>

                                {/* Footer Links */}
                               <div>
                                    <h3 className="text-lg font-semibold mb-4">Footer Link Columns</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {footerCategories.map((cat, catIndex) => (
                                            <Card key={cat.id}>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">{cat.title}</CardTitle>
                                                    <div className="flex items-center">
                                                        <Button variant="ghost" size="icon" disabled={catIndex === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" disabled={catIndex === footerCategories.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-1">
                                                        {(cat.links || []).map((link, linkIndex) => (
                                                            <div key={link.id} className="flex items-center justify-between p-1 rounded hover:bg-muted">
                                                                <p className="text-sm">{link.label}</p>
                                                                <div className="flex items-center">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="w-full mt-2"><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Add Footer Column</Button>
                               </div>
                           </CardContent>
                       </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
