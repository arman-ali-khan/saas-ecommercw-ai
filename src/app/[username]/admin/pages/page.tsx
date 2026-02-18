
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PagesAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
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
      toast({ variant: 'destructive', title: 'Error fetching pages', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPages();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchPages]);

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
            await fetchPages();
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
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Page Manager</CardTitle>
                <CardDescription>Create, edit, and manage custom pages for your site.</CardDescription>
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
            Create, edit, and manage the custom pages for your site.
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/pages/new`}>
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
                <Link href={`/admin/pages/new`}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Page
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
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
                          <Badge variant={page.is_published ? 'default' : 'outline'}>
                            {page.is_published ? 'Published' : 'Draft'}
                          </Badge>
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

              {/* Mobile View: Cards */}
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
                      </div>
                      <CardDescription className="font-mono text-xs">/pages/{page.slug}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <Badge variant={page.is_published ? 'default' : 'outline'}>
                            {page.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{format(new Date(page.updated_at), 'PP')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0">
            <div className="w-full max-w-md p-6 bg-background rounded-lg shadow-xl border animate-in zoom-in-95">
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-foreground">Are you absolutely sure?</h3>
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                            This will permanently delete the page "{pageToDelete.title}". This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button variant="outline" onClick={() => setPageToDelete(null)}>
                    Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={cn(buttonVariants({ variant: 'destructive' }))}
                    >
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
