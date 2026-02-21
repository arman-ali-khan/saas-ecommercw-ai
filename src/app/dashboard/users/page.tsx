'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
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
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Globe, Loader2, ShieldOff, ShieldCheck, Plus, X, AlertTriangle, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const USERS_PER_PAGE = 10;

const createAdminSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    username: z.string().min(3, "Username is too short").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    domain: z.string().min(3, "Domain is too short").regex(/^[a-z0-9-]+$/, "Domain can only contain lowercase letters, numbers, and hyphens"),
    siteName: z.string().min(2, "Site name is too short"),
});

export default function UsersAdminPage() {
    const { user: currentUser } = useAuth();
    const { admins: users, setAdmins } = useSaasStore();
    const { toast } = useToast();
    
    // Initialize loading to false if we already have admins in the store
    const [loading, setLoading] = useState(() => {
        const currentStore = useSaasStore.getState();
        return currentStore.admins.length === 0;
    });

    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBlockOpen, setIsBlockOpen] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [baseDomain, setBaseDomain] = useState('schoolbd.top');
    const [currentPage, setCurrentPage] = useState(1);

    const form = useForm<z.infer<typeof createAdminSchema>>({
        resolver: zodResolver(createAdminSchema),
        defaultValues: { fullName: '', username: '', email: '', password: '', domain: '', siteName: '' },
    });

    const fetchUsersData = useCallback(async (force = false) => {
        const currentStore = useSaasStore.getState();
        const now = Date.now();
        const isFresh = now - currentStore.lastFetched.admins < 600000; // 10 mins
        
        if (!force && currentStore.admins.length > 0 && isFresh) {
            setLoading(false);
            return;
        }

        if (currentStore.admins.length === 0 || force) {
            setLoading(true);
        }

        try {
            const response = await fetch('/api/saas/admins/list');
            const result = await response.json();
            
            if (response.ok) {
                setAdmins(result.users || []);
            } else {
                throw new Error(result.error);
            }

            const settingsRes = await fetch('/api/saas/fetch-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity: 'settings' }),
            });
            const settingsResult = await settingsRes.json();
            if (settingsRes.ok && settingsResult.data?.base_domain) {
                setBaseDomain(settingsResult.data.base_domain);
            }

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: e.message });
        } finally {
            setLoading(false);
        }
    }, [toast, setAdmins]);

    useEffect(() => {
        if (currentUser) {
            fetchUsersData();
        }
    }, [fetchUsersData, currentUser]);

    const onSubmitCreate = async (values: z.infer<typeof createAdminSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/saas/admins/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Success', description: 'New store owner created successfully.' });
                setIsCreateOpen(false);
                form.reset();
                await fetchUsersData(true);
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDeleteClick = (userItem: any) => {
        setSelectedUser(userItem);
        setIsDeleteOpen(true);
    }
    
    const handleBlockClick = (userItem: any) => {
        setSelectedUser(userItem);
        setIsBlockOpen(true);
    }
    
    const paginatedUsers = useMemo(() => users.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    ), [users, currentPage]);

    const performDelete = async () => {
        if (!selectedUser) return;
        setIsDeleting(true);
        try {
            const response = await fetch('/api/saas/admins/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id }),
            });
            if (response.ok) {
                toast({ title: 'User deleted!' });
                await fetchUsersData(true);
            } else {
                const res = await response.json();
                throw new Error(res.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
            setSelectedUser(null);
        }
    }
    
    const performBlock = async () => {
        if (!selectedUser) return;
        setIsBlocking(true);
        const newStatus = selectedUser.subscription_status === 'active' ? 'inactive' : 'active';
        try {
            const response = await fetch('/api/saas/admins/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id, status: newStatus }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: `Store has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}.` });
                await fetchUsersData(true);
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action failed', description: e.message });
        } finally {
            setIsBlocking(false);
            setIsBlockOpen(false);
            setSelectedUser(null);
        }
    }
    
    const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'active': return 'default';
            case 'pending': return 'secondary';
            case 'pending_verification': return 'secondary';
            case 'inactive': return 'destructive';
            default: return 'outline';
        }
    };
    
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    
    if (loading && users.length === 0) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
                    <p className="text-muted-foreground">View and manage all registered user stores.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add New Store</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {users.length > 0 ? (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Site</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.map(userItem => (
                                            <TableRow key={userItem.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar><AvatarFallback>{userItem.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                                                        <div>
                                                            <p className="font-semibold">{userItem.full_name}</p>
                                                            <p className="text-sm text-muted-foreground">@{userItem.username}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-semibold">{userItem.site_name}</p>
                                                    <p className="text-sm text-muted-foreground">{userItem.domain}.{baseDomain}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(userItem.subscription_status)}>{userItem.subscription_status || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${userItem.id}`} className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> View Profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                             <DropdownMenuItem asChild>
                                                                <a href={`//${userItem.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                                                    <Globe className="mr-2 h-4 w-4" /> Visit Site
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${userItem.id}/edit`} className="cursor-pointer w-full"><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleBlockClick(userItem)}>
                                                                {userItem.subscription_status === 'active' ? (
                                                                    <><ShieldOff className="mr-2 h-4 w-4" /> Block</>
                                                                ) : (
                                                                    <><ShieldCheck className="mr-2 h-4 w-4" /> Unblock</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteClick(userItem)}>
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
                                {paginatedUsers.map(userItem => (
                                    <Card key={userItem.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10"><AvatarFallback>{userItem.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">{userItem.full_name}</CardTitle>
                                                        <CardDescription>@{userItem.username}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant={getStatusBadgeVariant(userItem.subscription_status)}>{userItem.subscription_status || 'N/A'}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-4">
                                            <div className="space-y-1 text-sm">
                                                <p><span className="font-medium text-foreground">Site:</span> {userItem.site_name}</p>
                                                <p className="text-muted-foreground"><span className="font-medium text-foreground">Domain:</span> {userItem.domain}.{baseDomain}</p>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                            <Button variant="outline" size="sm" asChild><Link href={`/dashboard/users/${userItem.id}`}>View</Link></Button>
                                            <Button variant="outline" size="sm" asChild><Link href={`/dashboard/users/${userItem.id}/edit`}>Edit</Link></Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(userItem)}>Delete</Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center py-16">No users found.</p>
                    )}
                </CardContent>
                 {users.length > USERS_PER_PAGE && (
                  <CardFooter className="justify-center border-t py-4">
                      <div className="flex items-center gap-4 text-sm">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prevPage => Math.max(1, prevPage - 1))} disabled={currentPage === 1}>Previous</Button>
                          <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prevPage => Math.min(totalPages, prevPage + 1))} disabled={currentPage === totalPages}>Next</Button>
                      </div>
                  </CardFooter>
                )}
            </Card>

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsDeleteOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                            <h3 className="text-xl font-bold text-foreground">Delete User?</h3>
                        </div>
                        <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This will permanently delete <strong>"{selectedUser?.full_name}"</strong> and their store data. This action cannot be undone.</p></div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="destructive" onClick={performDelete} disabled={isDeleting}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete User</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block/Unblock Modal */}
            {isBlockOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isBlocking && setIsBlockOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4 text-primary">
                            <div className="p-2 bg-primary/10 rounded-full">
                                {selectedUser?.subscription_status === 'active' ? <ShieldOff className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{selectedUser?.subscription_status === 'active' ? 'Block Store?' : 'Unblock Store?'}</h3>
                        </div>
                        <div className="mb-8">
                            <p className="text-muted-foreground leading-relaxed">
                                Are you sure you want to {selectedUser?.subscription_status === 'active' ? 'block' : 'unblock'} the store for <strong>"{selectedUser?.site_name}"</strong>? 
                                {selectedUser?.subscription_status === 'active' ? ' The admin will no longer be able to access the dashboard.' : ' The admin will regain full access.'}
                            </p>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsBlockOpen(false)} disabled={isBlocking}>Cancel</Button>
                            <Button onClick={performBlock} disabled={isBlocking}>
                                {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm {selectedUser?.subscription_status === 'active' ? 'Block' : 'Unblock'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsCreateOpen(false)} />
                    <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold">Add New Store Owner</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="fullName" render={({ field: nameField }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...nameField} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="username" render={({ field: userField }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="johndoe" {...userField} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="email" render={({ field: emailField }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...emailField} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="password" render={({ field: passField }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••" {...passField} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="siteName" render={({ field: siteField }) => (<FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="My Nature Shop" {...siteField} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="domain" render={({ field: domField }) => (<FormItem><FormLabel>Domain</FormLabel><div className="flex items-center"><FormControl><Input placeholder="nature-shop" className="rounded-r-none" {...domField} /></FormControl><span className="bg-muted px-3 h-10 flex items-center border border-l-0 rounded-r-md text-xs text-muted-foreground">.{baseDomain}</span></div><FormMessage /></FormItem>)} />
                                    </div>
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmitCreate)} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
