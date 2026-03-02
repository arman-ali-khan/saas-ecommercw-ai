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
  const [copiedField, setCopiedField] = useState<number | null>(null);

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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedField(index);
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
        <Card className="border-2 overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 border-b p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl"><Globe className="h-8 w-8 text-primary" /></div>
                <div>
                  <CardTitle className="text-2xl font-black">{request.custom_domain}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">Status: <span className="text-primary">{request.status.replace('_', ' ')}</span></CardDescription>
                </div>
              </div>
              <Badge variant={request.status === 'active' ? 'default' : 'secondary'} className="px-6 py-1.5 text-xs font-black uppercase tracking-widest">
                {request.status === 'active' ? 'CONNECTED' : (request.status === 'approved' ? 'AWAITING SETUP' : 'IN REVIEW')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 p-8">
            {request.status === 'pending' && (
              <div className="p-8 rounded-[2rem] bg-primary/5 border-2 border-primary/10 flex flex-col items-center text-center gap-4 animate-in fade-in">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="space-y-2">
                  <p className="text-xl font-bold text-foreground">Reviewing your request</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">We are verifying your domain request. This usually takes 24-48 hours. Once approved, you will see DNS instructions here.</p>
                </div>
              </div>
            )}

            {(request.status === 'approved' || request.status === 'active') && Array.isArray(request.dns_info) && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="p-6 rounded-2xl bg-green-500/5 border-2 border-green-500/20">
                  <h3 className="font-bold flex items-center gap-2 mb-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" /> Domain Approved
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Please update your domain's DNS settings at your registrar (e.g. Namecheap, GoDaddy) using the information below.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">DNS Configuration Required</Label>
                  <div className="rounded-2xl border-2 bg-card overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold py-4 pl-6">Type</TableHead>
                          <TableHead className="font-bold py-4">Host / Name</TableHead>
                          <TableHead className="font-bold py-4">Value / Points To</TableHead>
                          <TableHead className="w-12 pr-6"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {request.dns_info.map((record: any, idx: number) => (
                            <TableRow key={idx}>
                                <TableCell className="font-black text-primary pl-6">{record.type}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{record.host}</code>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(record.host, idx * 2)}>
                                            {copiedField === idx * 2 ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded">{record.value}</code>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(record.value, idx * 2 + 1)}>
                                            {copiedField === idx * 2 + 1 ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-2xl bg-amber-500/5 border-2 border-amber-500/10 text-sm">
                  <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-400">DNS Propagation Warning</p>
                    <p className="text-amber-600/80 dark:text-amber-500/80 leading-relaxed">DNS changes can take up to 24 hours to propagate worldwide. Your store will automatically become available at this domain once the link is active and verified by our system.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/20 border-t flex flex-col sm:flex-row justify-between p-8 gap-4">
             <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Info className="h-4 w-4" />
                <span>Need help? Contact our support forum.</span>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none rounded-xl h-11" asChild>
                    <a href={`//${request.custom_domain}`} target="_blank" className="gap-2 font-bold">Visit Site <ExternalLink className="h-3 w-3" /></a>
                </Button>
                {request.status === 'pending' && (
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/5 rounded-xl h-11">Cancel Request</Button>
                )}
             </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-2 shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/5 p-10 border-b border-primary/10">
            <CardTitle className="text-3xl font-black">Request Custom Domain</CardTitle>
            <CardDescription className="text-lg mt-2 font-medium">Enter the domain you've purchased to link it to your store.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-base">Domain Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                          <Input placeholder="e.g. yourshop.com" className="pl-14 h-16 text-2xl rounded-2xl border-2 focus:border-primary font-medium" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm font-medium">Do not include http:// or https:// (e.g., example.com)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-8 rounded-[2rem] bg-muted/30 border-2 border-dashed space-y-6">
                  <h4 className="font-black flex items-center gap-2 text-primary uppercase tracking-[0.2em] text-xs">Requirements & Benefits</h4>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    <li className="flex items-start gap-3 text-sm text-muted-foreground font-bold">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> You must already own the domain.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground font-bold">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Available for Pro/Enterprise plans.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground font-bold">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Professional branding & trust.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground font-bold">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Automated SSL certificate included.
                    </li>
                  </ul>
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-12 h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                  {isSubmitting ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Submitting...</> : <>Submit Request <CheckCircle2 className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" /></>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
