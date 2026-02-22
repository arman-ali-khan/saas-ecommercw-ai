
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
import { Globe, Loader2, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import type { CustomDomainRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-muted-foreground">Connect your own domain name to your store for a professional look.</p>
      </div>

      {request ? (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl"><Globe className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle className="text-xl">{request.custom_domain}</CardTitle>
                  <CardDescription>Status: <span className="capitalize font-bold">{request.status}</span></CardDescription>
                </div>
              </div>
              <Badge variant={request.status === 'active' ? 'default' : 'secondary'} className="px-4 py-1 text-sm">
                {request.status === 'active' ? 'Connected' : 'In Review'}
              </Badge>
            </div>
          </Header>
          <CardContent className="space-y-6 pt-4">
            {request.status === 'pending' && (
              <div className="p-4 rounded-xl bg-muted/50 border flex gap-4">
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Reviewing your request</p>
                  <p className="text-xs text-muted-foreground">We are verifying your domain request. This usually takes 24-48 hours. Once approved, you will see DNS instructions here.</p>
                </div>
              </div>
            )}

            {(request.status === 'approved' || request.status === 'active') && request.dns_info && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h3 className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Domain Approved</h3>
                  <p className="text-sm text-muted-foreground">Please update your domain's DNS settings at your registrar (e.g. Namecheap, GoDaddy) using the information below.</p>
                </div>

                <div className="grid gap-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">DNS Setup Instructions</Label>
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name/Host</TableHead>
                          <TableHead>Value/Points To</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold">{request.dns_info.type}</TableCell>
                          <TableCell className="font-mono text-xs">{request.dns_info.value}</TableCell>
                          <TableCell className="font-mono text-xs text-primary font-bold">{request.dns_info.pointsTo}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(request.dns_info!.pointsTo, 'val')}>
                              {copiedField === 'val' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-amber-700 dark:text-amber-400">DNS changes can take up to 24 hours to propagate worldwide. Your store will automatically become available at this domain once the link is active.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/20 border-t flex justify-between py-4">
             <Button variant="outline" size="sm" asChild>
                <a href={`//${request.custom_domain}`} target="_blank" className="gap-2">Visit Domain <ExternalLink className="h-3 w-3" /></a>
             </Button>
             {request.status === 'pending' && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Cancel Request</Button>
             )}
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Request Custom Domain</CardTitle>
            <CardDescription>Enter the domain you've purchased to link it to your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g. www.yourshop.com" className="pl-10 h-12 text-lg" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>Do not include http:// or https://</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed text-sm space-y-3">
                  <h4 className="font-bold">Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>You must already own the domain.</li>
                    <li>This feature is available for Pro and Enterprise plans.</li>
                    <li>Subdomains (e.g. shop.domain.com) are also supported.</li>
                  </ul>
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-10 rounded-xl shadow-lg shadow-primary/20">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
