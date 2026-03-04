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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Globe, Loader2, ShieldOff, ShieldCheck, Plus, X, AlertTriangle, Eye, Search, Filter, Store, User as UserIcon } from 'lucide-react';
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

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const form = useForm<z.infer<typeof createAdminSchema>>({
        resolver: zodResolver(createAdminSchema),
        defaultValues: { fullName: '', username: '', email: '', password: '', domain: '', siteName: '' },
    });

    const fetchUsersData = useCallback(async (force = false) => {
        const currentStore = useSaasStore.getState();
        const now = Date.now();
        const isFresh = now - currentStore.lastFetched.admins < 600000;
        
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
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                (user.full_name || '').toLowerCase().includes(searchLower) ||
                (user.email || '').toLowerCase().includes(searchLower) ||
                (user.site_name || '').toLowerCase().includes(searchLower) ||
                (user.domain || '').toLowerCase().includes(searchLower);
            
            const matchesStatus = statusFilter === 'all' || user.subscription_status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [users, searchQuery, statusFilter]);

    const paginatedUsers = useMemo(() => filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    ), [filteredUsers, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

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
    
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    
    if (loading && users.length === 0) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
                    <p className="text-muted-foreground">View and manage all registered user stores.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-full shadow-lg"><Plus className="mr-2 h-4 w-4" /> Add Store</Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-grow max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, site, or domain..." 
                                className="pl-10 h-11 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-44 h-11 rounded-xl">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="z-[110]">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending_verification">Pending</SelectItem>
                                <SelectItem value="inactive">Blocked</SelectItem>
                            </SelectContent>
                        </Select>
                        {(searchQuery || statusFilter !== 'all') && (
                            <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="h-11 w-11 rounded-xl">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredUsers.length > 0 ? (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="pl-6">User</TableHead>
                                            <TableHead>Site</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.map(userItem => (
                                            <TableRow key={userItem.id} className="hover:bg-muted/10">
                                                <TableCell className="font-medium pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar><AvatarFallback className="font-bold">{userItem.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                                                        <div>
                                                            <p className="font-bold text-sm">{userItem.full_name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">@{userItem.username}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-bold text-sm">{userItem.site_name}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground">{userItem.domain}.{baseDomain}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(userItem.subscription_status)} className="capitalize text-[10px] px-2 h-5">
                                                        {userItem.subscription_status?.replace('_', ' ') || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-2">
                                                            <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Management</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${userItem.id}`} className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> View Full Activity
                                                                </Link>
                                                            </DropdownMenuItem>
                                                             <DropdownMenuItem asChild>
                                                                <a href={`//${userItem.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                                                    <Globe className="mr-2 h-4 w-4" /> Visit Public Site
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${userItem.id}/edit`} className="cursor-pointer w-full"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleBlockClick(userItem)}>
                                                                {userItem.subscription_status === 'inactive' ? (
                                                                    <><ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Unblock Store</>
                                                                ) : (
                                                                    <><ShieldOff className="mr-2 h-4 w-4 text-destructive" /> Block Store</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive cursor-pointer font-bold" onClick={() => handleDeleteClick(userItem)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Permanent Delete
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
                                    <Card key={userItem.id} className="border shadow-sm overflow-hidden group">
                                        <CardHeader className="p-4 pb-2 bg-muted/10 border-b">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-background"><AvatarFallback className="font-bold">{userItem.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-sm font-bold truncate">{userItem.full_name}</CardTitle>
                                                        <CardDescription className="text-[10px] font-black uppercase tracking-widest">@{userItem.username}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusBadgeVariant(userItem.subscription_status)} className="capitalize text-[8px] h-4">
                                                        {userItem.subscription_status?.replace('_', ' ') || 'N/A'}
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-2">
                                                            <DropdownMenuItem asChild><Link href={`/dashboard/users/${userItem.id}`}><Eye className="mr-2 h-4 w-4" /> View Activity</Link></DropdownMenuItem>
                                                            <DropdownMenuItem asChild><Link href={`/dashboard/users/${userItem.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link></DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBlockClick(userItem)}>
                                                                {userItem.subscription_status === 'inactive' ? (
                                                                    <><ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Unblock</>
                                                                ) : (
                                                                    <><ShieldOff className="mr-2 h-4 w-4 text-destructive" /> Block</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleDeleteClick(userItem)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-bold text-foreground">{userItem.site_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] font-mono text-muted-foreground truncate">{userItem.domain}.{baseDomain}</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-2 flex flex-wrap gap-2 border-t mt-2 bg-muted/5">
                                            <Button variant="secondary" size="sm" asChild className="h-8 rounded-lg text-[10px] font-black uppercase flex-grow"><Link href={`/dashboard/users/${userItem.id}`}>View Profile</Link></Button>
                                            <Button 
                                                variant={userItem.subscription_status === 'inactive' ? "outline" : "ghost"} 
                                                size="sm" 
                                                onClick={() => handleBlockClick(userItem)}
                                                className={cn("h-8 rounded-lg text-[10px] font-black uppercase flex-grow", userItem.subscription_status === 'inactive' ? "text-green-600 border-green-200 bg-green-50" : "text-destructive hover:bg-destructive/10")}
                                            >
                                                {userItem.subscription_status === 'inactive' ? 'Unblock' : 'Block'}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg ml-auto" onClick={() => handleDeleteClick(userItem)}><Trash2 className="h-4 w-4" /></Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center py-16">No stores found matching your criteria.</p>
                    )}
                </CardContent>
                 {filteredUsers.length > USERS_PER_PAGE && (
                  <CardFooter className="justify-center border-t py-6 bg-muted/10">
                      <div className="flex items-center gap-4 text-xs sm:text-sm">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prevPage => Math.max(1, prevPage - 1))} disabled={currentPage === 1} className="h-9 px-3 rounded-lg">Prev</Button>
                          <span className="text-muted-foreground font-black uppercase tracking-tighter">Page {currentPage} of {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prevPage => Math.min(totalPages, prevPage + 1))} disabled={currentPage === totalPages} className="h-9 px-3 rounded-lg">Next</Button>
                      </div>
                  </CardFooter>
                )}
            </Card>

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsDeleteOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border-2 p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-destructive/10 rounded-full text-destructive animate-bounce">
                                <AlertTriangle className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">Delete Store?</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">This will permanently delete <strong>"{selectedUser?.full_name}"</strong> and their store data. This action is irreversible.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-8">
                            <Button variant="destructive" onClick={performDelete} disabled={isDeleting} className="h-12 rounded-xl font-black text-lg shadow-lg shadow-destructive/20">
                                {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "DELETE PERMANENTLY"}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="h-12 rounded-xl font-bold">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block/Unblock Modal */}
            {isBlockOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isBlocking && setIsBlockOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border-2 p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn("p-4 rounded-full", selectedUser?.subscription_status === 'inactive' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                                {selectedUser?.subscription_status === 'inactive' ? <ShieldCheck className="h-10 w-10" /> : <ShieldOff className="h-10 w-10" />}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">{selectedUser?.subscription_status === 'inactive' ? 'Unblock Store?' : 'Block Store?'}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Are you sure you want to {selectedUser?.subscription_status === 'inactive' ? 'unblock' : 'block'} access for <strong>"{selectedUser?.site_name}"</strong>? 
                                    {selectedUser?.subscription_status === 'inactive' ? ' Access will be restored immediately.' : ' The admin will lose dashboard access immediately.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-8">
                            <Button onClick={performBlock} disabled={isBlocking} className="h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20">
                                {isBlocking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (selectedUser?.subscription_status === 'inactive' ? "UNBLOCK STORE" : "BLOCK STORE")}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBlockOpen(false)} disabled={isBlocking} className="h-12 rounded-xl font-bold">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsCreateOpen(false)} />
                    <div className="relative w-full max-w-xl bg-background rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl border-2 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30 shrink-0">
                            <h2 className="text-xl font-black uppercase tracking-widest">Add New Store</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="fullName" render={({ field: nameField }) => (<FormItem><FormLabel className="font-bold">Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...nameField} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="username" render={({ field: userField }) => (<FormItem><FormLabel className="font-bold">Username</FormLabel><FormControl><Input placeholder="johndoe" {...userField} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="email" render={({ field: emailField }) => (<FormItem><FormLabel className="font-bold">Email Address</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...emailField} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="password" render={({ field: passField }) => (<FormItem><FormLabel className="font-bold">Initial Password</FormLabel><FormControl><Input type="password" placeholder="••••••" {...passField} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="siteName" render={({ field: siteField }) => (<FormItem><FormLabel className="font-bold">Public Store Name</FormLabel><FormControl><Input placeholder="Organic Farm" {...siteField} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="domain" render={({ field: domField }) => (<FormItem><FormLabel className="font-bold">Store Domain</FormLabel><div className="flex items-center"><FormControl><Input placeholder="farm" className="rounded-r-none h-11 rounded-l-xl" {...domField} /></FormControl><span className="bg-muted px-3 h-11 flex items-center border border-l-0 rounded-r-xl text-[10px] font-black text-muted-foreground">.{baseDomain}</span></div><FormMessage /></FormItem>)} />
                                    </div>
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0 bg-muted/30 pb-10 sm:pb-6">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting} className="h-12 rounded-xl px-8 font-bold order-2 sm:order-1">Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmitCreate)} disabled={isSubmitting} className="h-12 rounded-xl px-10 font-black shadow-lg shadow-primary/20 order-1 sm:order-2">
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "CREATE STORE"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
