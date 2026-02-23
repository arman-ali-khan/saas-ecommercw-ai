'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Page } from '@/types';
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
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Eye, AlertTriangle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PagesAdminPage() {
  const { user } = useAuth();
  const { pages, setPages } = useAdminStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(() => {
    const store = useAdminStore.getState();
    return store.pages.length === 0;
  });
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async (force = false) => {
    if (!user) return;
    
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.pages < 300000;
    
    if (!force && store.pages.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (store.pages.length === 0 || force) {
        setIsLoading(true);
    }

    try {
        const response = await fetch('/api/pages/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        if (response.ok) {
            setPages(result.pages || []);
        } else {
            throw new Error(result.error || 'Failed to fetch pages');
        }
    } catch (error: any) {
      if (pages.length === 0) {
          toast({ variant: 'destructive', title: 'Error fetching pages', description: error.message });
      }
    } finally {
        setIsLoading(false);
    }
  }, [user, setPages, toast, pages.length]);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user, fetchPages]);

  const handleDelete = async () => {
    if (!pageToDelete || !user) return;
    setIsDeleting(true);
    try {
        const response = await fetch('/api/pages/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pageToDelete.id, siteId: user.id }),
        });
        const result = await response.json();
        
        if (response.ok) {
            toast({ title: 'Page Deleted' });
            await fetchPages(true);
        } else {
            throw new Error(result.error || 'Failed to delete page');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error deleting page', description: error.message });
    } finally {
        setIsDeleting(false);
        setPageToDelete(null);
    }
  };
  
  if (isLoading && pages.length === 0) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36 rounded-md" />
            </div>
            <Card>
                <CardHeader className="p-0 border-b">
                    <div className="p-4 grid grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 grid grid-cols-5 gap-4 items-center border-b last:border-0">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-32 font-mono" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Page Manager</h1>
          <p className="text-muted-foreground">Create, edit, and manage the custom pages for your site.</p>
        </div>
        <Button asChild>
          <Link href={`/admin/pages/new`}>
            <Plus className="mr-2 h-4 w-4" /> Add New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">You have no pages yet.</p>
              <Button asChild className="mt-4">
                <Link href={`/admin/pages/new`}><Plus className="mr-2 h-4 w-4" /> Create Your First Page</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
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
                        <TableCell className="font-mono text-xs">/pages/{page.slug}</TableCell>
                        <TableCell>
                          <Badge variant={page.is_published ? 'default' : 'outline'}>{page.is_published ? 'Published' : 'Draft'}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(page.updated_at), 'PPp')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/pages/${page.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/pages/${page.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setPageToDelete(page)}>
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

              <div className="grid gap-4 md:hidden p-4">
                {pages.map((page) => (
                  <Card key={page.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{page.title}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/pages/${page.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> View</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/admin/pages/${page.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setPageToDelete(page)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="font-mono text-xs">/pages/{page.slug}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <Badge variant={page.is_published ? 'default' : 'outline'}>{page.is_published ? 'Published' : 'Draft'}</Badge>
                        <p className="text-xs text-muted-foreground">{format(new Date(page.updated_at), 'PP')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setPageToDelete(null)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold">Are you absolutely sure?</h3>
                </div>
                <p className="text-muted-foreground mb-8">This will permanently delete the page "{pageToDelete.title}". This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setPageToDelete(null)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
