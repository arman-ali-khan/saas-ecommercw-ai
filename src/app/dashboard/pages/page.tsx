'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/stores/auth';

type SaasPage = { id: string; slug: string; title: string; title_en?: string; is_published: boolean; updated_at: string; }

export default function SaasPagesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<SaasPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'pages' }),
        });
        const result = await response.json();
        if (response.ok) setPages(result.data as SaasPage[]);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { if (user) fetchPages(); }, [fetchPages, user]);

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">SaaS Pages</h1><p className="text-muted-foreground">Manage platform pages in BN and EN.</p></div>
        <Button asChild><Link href={`/dashboard/pages/new`}><Plus className="mr-2 h-4 w-4" /> Add Page</Link></Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title (BN/EN)</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="font-bold">{page.title}</div>
                    <div className="text-xs text-muted-foreground">{page.title_en || 'No EN Title'}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">/p/{page.slug}</TableCell>
                  <TableCell><Badge variant={page.is_published ? 'default' : 'outline'}>{page.is_published ? 'Published' : 'Draft'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/pages/${page.id}`}><Edit className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}