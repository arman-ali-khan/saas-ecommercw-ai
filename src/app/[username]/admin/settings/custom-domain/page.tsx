
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check, Info } from 'lucide-react';
import type { CustomDomainRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const domainSchema = z.object({
  domain: z.string().min(3, "Domain name is too short").regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Please enter a valid domain (e.g., example.com)"),
});

export default function CustomDomainAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<CustomDomainRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  const fetchRequest = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/custom-domain/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const result = await response.json();
      if (response.ok) {
        setRequest(result.request);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const onSubmit = async (values: { domain: string }) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/settings/custom-domain/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id, domain: values.domain }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Request submitted!', description: 'Our team will review your domain shortly.' });
        fetchRequest();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Request failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-muted-foreground">Connect your own domain name to your store for a professional look.</p>
      </div>

      {request ? (
        <Card className="border-2 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl"><Globe className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle className="text-xl">{request.custom_domain}</CardTitle>
                  <CardDescription>Status: <span className="capitalize font-bold">{request.status}</span></CardDescription>
                </div>
              </div>
              <Badge variant={request.status === 'active' ? 'default' : 'secondary'} className="px-4 py-1 text-sm font-bold">
                {request.status === 'active' ? 'CONNECTED' : (request.status === 'approved' ? 'AWAITING SETUP' : 'IN REVIEW')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {request.status === 'pending' && (
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex gap-4 animate-pulse">
                <Loader2 className="h-6 w-6 text-primary animate-spin shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground">Reviewing your request</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">We are verifying your domain request. This usually takes 24-48 hours. Once approved, you will see DNS instructions here.</p>
                </div>
              </div>
            )}

            {(request.status === 'approved' || request.status === 'active') && request.dns_info && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="p-6 rounded-2xl bg-green-500/5 border-2 border-green-500/20">
                  <h3 className="font-bold flex items-center gap-2 mb-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" /> Domain Approved
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Please update your domain's DNS settings at your registrar (e.g. Namecheap, GoDaddy) using the information below.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">DNS Configuration Required</Label>
                  <div className="rounded-2xl border-2 bg-card overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold">Type</TableHead>
                          <TableHead className="font-bold">Host / Name</TableHead>
                          <TableHead className="font-bold">Value / Points To</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-black text-primary">{request.dns_info.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{request.dns_info.value}</code>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(request.dns_info!.value, 'host')}>
                                    {copiedField === 'host' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-50" />}
                                </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">{request.dns_info.pointsTo}</code>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(request.dns_info!.pointsTo, 'val')}>
                                    {copiedField === 'val' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-50" />}
                                </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/10 text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-400">DNS Propagation Warning</p>
                    <p className="text-amber-600/80 dark:text-amber-500/80">DNS changes can take up to 24 hours to propagate worldwide. Your store will automatically become available at this domain once the link is active and verified by our system.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/20 border-t flex flex-col sm:flex-row justify-between py-6 gap-4">
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Need help? Contact our support forum.</span>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none" asChild>
                    <a href={`//${request.custom_domain}`} target="_blank" className="gap-2">Visit Site <ExternalLink className="h-3 w-3" /></a>
                </Button>
                {request.status === 'pending' && (
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/5">Cancel Request</Button>
                )}
             </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
            <CardTitle className="text-2xl">Request Custom Domain</CardTitle>
            <CardDescription className="text-base mt-2">Enter the domain you've purchased to link it to your store.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Domain Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="e.g. yourshop.com" className="pl-12 h-14 text-xl rounded-xl border-2 focus:border-primary" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>Do not include http:// or https://</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-6 rounded-2xl bg-muted/30 border-2 border-dashed space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-primary uppercase tracking-widest text-xs">Requirements</h4>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> You must already own the domain.
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Available for Pro/Enterprise plans.
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Supports subdomains (e.g. shop.me.com).
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Automated SSL certificate included.
                    </li>
                  </ul>
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-12 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : 'Submit Request'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
