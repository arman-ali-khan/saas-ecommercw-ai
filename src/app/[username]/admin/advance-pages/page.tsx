
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Edit, Trash2, Wand2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdvancePagesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/advance-pages/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const result = await res.json();
      if (res.ok) setPages(result.pages || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/advance-pages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, siteId: user.id }),
      });
      if (res.ok) {
        toast({ title: 'Page deleted' });
        fetchPages();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && pages.length === 0) {
    return <div className="p-8 space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary" /> Visual Builder</h1>
          <p className="text-muted-foreground">Design landing pages with drag-and-drop precision.</p>
        </div>
        <Button asChild><Link href="/admin/advance-pages/new"><Plus className="mr-2 h-4 w-4" /> Create Design</Link></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No visual designs found.</p>
              <Button asChild variant="outline" className="mt-4"><Link href="/admin/advance-pages/new">Start Designing</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Design Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Edited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-bold">{page.title}</TableCell>
                    <TableCell className="font-mono text-xs">/pages/{page.slug}</TableCell>
                    <TableCell><Badge variant={page.is_published ? 'default' : 'outline'}>{page.is_published ? 'Live' : 'Draft'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(page.updated_at), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild><Link href={`/admin/advance-pages/${page.id}`}><Edit className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(page.id)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
