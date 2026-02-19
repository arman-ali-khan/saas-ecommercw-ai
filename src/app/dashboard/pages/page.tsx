'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/stores/auth';

type SaasPage = {
    id: string;
    slug: string;
    title: string;
    is_published: boolean;
    updated_at: string;
}

export default function SaasPagesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<SaasPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageToDelete, setPageToDelete] = useState<SaasPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'pages' }),
        });
        const result = await response.json();
        if (response.ok) {
            setPages(result.data as SaasPage[]);
        } else {
            throw new Error(result.error || 'Failed to fetch pages');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching pages', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [fetchPages, user]);

  const handleDelete = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    try {
        const response = await fetch('/api/saas/pages/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pageToDelete.id }),
        });
        if (response.ok) {
            toast({ title: 'Page Deleted' });
            await fetchPages();
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete page');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsDeleting(false);
        setPageToDelete(null);
    }
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Page Manager</CardTitle>
                <CardDescription>Create and manage static pages for your SaaS platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Page Manager</h1>
          <p className="text-muted-foreground">
            Create and manage static pages for your SaaS platform.
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/pages/new`}>
            <Plus className="mr-2 h-4 w-4" /> Add New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">You have no pages yet.</p>
              <Button asChild className="mt-4">
                <Link href={`/dashboard/pages/new`}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Page
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pages.map((page) => (
                    <TableRow key={page.id}>
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell className="font-mono text-xs">/p/{page.slug}</TableCell>
                        <TableCell>
                        <Badge variant={page.is_published ? 'default' : 'outline'}>
                            {page.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(page.updated_at), 'MMM d, p')}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/p/${page.slug}`} target="_blank" className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/pages/${page.id}`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setPageToDelete(page)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Custom Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setPageToDelete(null)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">Delete SaaS Page?</h3>
                </div>
                <div className="mb-8">
                    <p className="text-muted-foreground leading-relaxed">
                        Are you absolutely sure you want to delete <strong>"{pageToDelete?.title}"</strong>? 
                        This will remove the page from the public URL <code>/p/{pageToDelete?.slug}</code> permanently.
                    </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setPageToDelete(null)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Page
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}