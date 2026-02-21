'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    ArrowLeft, 
    Package, 
    Users, 
    ShoppingBag, 
    Globe, 
    Mail, 
    Calendar, 
    ShieldCheck, 
    Loader2, 
    ChevronLeft, 
    ChevronRight,
    ExternalLink,
    Store,
    Wand2,
    Save
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ITEMS_PER_PAGE = 5;

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [aiKey, setAiKey] = useState('');
  
  // Local Pagination State
  const [productPage, setProductPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/admins/get-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setAiKey(result.profile?.gemini_api_key || ''); // Reusing old field name gemini_api_key for DB compatibility, but labeled as OpenRouter in UI
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      router.push('/dashboard/users');
    } finally {
      setIsLoading(false);
    }
  }, [userId, router, toast]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleSaveAiSettings = async () => {
    setIsSavingAi(true);
    try {
        const response = await fetch('/api/saas/admins/save-ai-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: userId, gemini_api_key: aiKey }),
        });
        if (response.ok) {
            toast({ title: 'AI settings updated for this store.' });
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Failed to update AI settings', description: e.message });
    } finally {
        setIsSavingAi(false);
    }
  };

  const paginatedProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);
  }, [data?.products, productPage]);

  const paginatedCustomers = useMemo(() => {
    if (!data?.customers) return [];
    return data.customers.slice((customerPage - 1) * ITEMS_PER_PAGE, customerPage * ITEMS_PER_PAGE);
  }, [data?.customers, customerPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats } = data;
  const plan = Array.isArray(profile.plans) ? profile.plans[0] : profile.plans;
  const isFreePlan = profile.subscription_plan === 'free';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/dashboard/users"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Stores</Link>
        </Button>
        <Button variant="outline" asChild>
            <Link href={`/dashboard/users/${userId}/edit`}>Edit Profile</Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/10">
                <AvatarFallback className="text-2xl bg-primary/5">{profile.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold">{profile.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary">@{profile.username}</Badge>
                  <Badge variant={profile.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {profile.subscription_status}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={`//${profile.domain}.schoolbd.top`} target="_blank" className="hover:underline text-primary flex items-center gap-1 font-mono">
                        {profile.domain}.schoolbd.top <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{profile.site_name}</span>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>Plan: <span className="font-bold text-primary">{plan?.name || 'Free'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Expires: {profile.subscription_end_date ? format(new Date(profile.subscription_end_date), 'PPP') : 'Never'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: {format(new Date(profile.created_at), 'PPP')}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Key Manager (OpenRouter) */}
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> AI Management</CardTitle>
                <CardDescription>Using OpenRouter (Arcee-AI Trinity).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isFreePlan ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                        AI features are disabled for Free plan users. Upgrade their plan to enable.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="openrouter-key" className="text-xs">OpenRouter API Key</Label>
                            <Input 
                                id="openrouter-key"
                                type="password" 
                                placeholder="sk-or-v1-..." 
                                value={aiKey} 
                                onChange={(e) => setAiKey(e.target.value)} 
                                className="h-9 bg-background"
                            />
                        </div>
                        <Button className="w-full h-9" size="sm" onClick={handleSaveAiSettings} disabled={isSavingAi}>
                            {isSavingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Key
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-muted/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Total Products <Package className="h-4 w-4 opacity-50" /></CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black text-primary">{stats.totalProducts}</div></CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Total Customers <Users className="h-4 w-4 opacity-50" /></CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black">{stats.totalCustomers}</div></CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Total Orders <ShoppingBag className="h-4 w-4 opacity-50" /></CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black">{stats.totalOrders}</div></CardContent>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="products">Products ({stats.totalProducts})</TabsTrigger>
          <TabsTrigger value="customers">Customers ({stats.totalCustomers})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Products List</CardTitle>
              <CardDescription>Recently added items by this store.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paginatedProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="relative h-10 w-10 rounded border overflow-hidden">
                            <Image src={p.images?.[0]?.imageUrl || 'https://placehold.co/40x40'} alt={p.name} fill className="object-cover" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.price} {p.currency}</TableCell>
                        <TableCell>{p.stock || 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'PP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">No products found for this store.</div>
              )}
            </CardContent>
            {stats.totalProducts > ITEMS_PER_PAGE && (
                <CardFooter className="justify-center border-t py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm">Page {productPage} of {Math.ceil(stats.totalProducts / ITEMS_PER_PAGE)}</span>
                        <Button variant="outline" size="icon" onClick={() => setProductPage(p => p + 1)} disabled={productPage * ITEMS_PER_PAGE >= stats.totalProducts}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registered Customers</CardTitle>
              <CardDescription>Users who have created an account on this site.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paginatedCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'PPp')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">No registered customers yet.</div>
              )}
            </CardContent>
            {stats.totalCustomers > ITEMS_PER_PAGE && (
                <CardFooter className="justify-center border-t py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setCustomerPage(p => Math.max(1, p - 1))} disabled={customerPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm">Page {customerPage} of {Math.ceil(stats.totalCustomers / ITEMS_PER_PAGE)}</span>
                        <Button variant="outline" size="icon" onClick={() => setCustomerPage(p => p + 1)} disabled={customerPage * ITEMS_PER_PAGE >= stats.totalCustomers}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}