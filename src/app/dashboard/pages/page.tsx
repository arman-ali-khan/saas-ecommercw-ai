
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaasPage = {
    id: string;
    slug: string;
    title: string;
    is_published: boolean;
    updated_at: string;
}

export default function SaasPagesAdminPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<SaasPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageToDelete, setPageToDelete] = useState<SaasPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saas_pages')
      .select('id, title, slug, is_published, updated_at')
      .order('title', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching pages', description: error.message });
    } else {
      setPages(data as SaasPage[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDelete = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    const { error } = await supabase.from('saas_pages').delete().eq('id', pageToDelete.id);
    setIsDeleting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting page', description: error.message });
    } else {
      toast({ title: 'Page Deleted' });
      await fetchPages();
    }
    setPageToDelete(null);
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
                    <TableCell>{format(new Date(page.updated_at), 'PPp')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/p/${page.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> View</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/pages/${page.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
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
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the page "{pageToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
