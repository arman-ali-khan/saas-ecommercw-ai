'use client';

import Link from 'next/link';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Globe, Loader2, ShieldOff, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type UserProfile = {
    id: string;
    username: string;
    full_name: string;
    email: string;
    domain: string;
    site_name: string;
    site_description: string;
    subscription_status: string;
};

const USERS_PER_PAGE = 10;

export default function UsersAdminPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBlockOpen, setIsBlockOpen] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const { toast } = useToast();
    const [baseDomain, setBaseDomain] = useState('schoolbd.top');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsersAndSettings = useCallback(async () => {
        setLoading(true);
        try {
            const usersPromise = supabase.from('profiles').select(`
                id,
                username,
                full_name,
                email,
                domain,
                site_name,
                site_description,
                subscription_status
            `).order('full_name', { ascending: true });
            const settingsPromise = supabase.from('saas_settings').select('base_domain').eq('id', 1).single();

            const [{ data: usersData, error: usersError }, { data: settingsData }] = await Promise.all([usersPromise, settingsPromise]);
            
            if (usersData) {
                setUsers(usersData as UserProfile[]);
            } else if (usersError) {
                toast({ variant: 'destructive', title: 'Error fetching users', description: usersError.message });
            }

            if (settingsData && settingsData.base_domain) {
                setBaseDomain(settingsData.base_domain);
            }

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsersAndSettings();
    }, [fetchUsersAndSettings]);


    const handleDeleteClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    }
    
    const handleBlockClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsBlockOpen(true);
    }
    
    const paginatedUsers = users.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    );

    const performDelete = async () => {
        if (!selectedUser) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Failed to delete user profile', description: error.message });
            } else {
                toast({ title: 'User profile deleted!' });
                if (paginatedUsers.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
                await fetchUsersAndSettings();
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
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
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_status: newStatus })
                .eq('id', selectedUser.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Failed to update status', description: error.message });
            } else {
                toast({ title: `Store has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}.` });
                await fetchUsersAndSettings();
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
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
            case 'canceled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Store Management</CardTitle>
                    <CardDescription>Loading store data from the database...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Store Management</CardTitle>
                    <CardDescription>View and manage all registered user stores.</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length > 0 ? (
                        <>
                            {/* Desktop View: Table */}
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
                                        {paginatedUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{user.full_name}</p>
                                                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-semibold">{user.site_name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.domain}.{baseDomain}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(user.subscription_status)}>{user.subscription_status || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                             <DropdownMenuItem asChild>
                                                                <a href={`//${user.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                                                    <Globe className="mr-2 h-4 w-4" /> View Site
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${user.id}/edit`} className="cursor-pointer w-full">
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleBlockClick(user)}>
                                                                {user.subscription_status === 'active' ? (
                                                                    <><ShieldOff className="mr-2 h-4 w-4" /> Block</>
                                                                ) : (
                                                                    <><ShieldCheck className="mr-2 h-4 w-4" /> Unblock</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteClick(user)}>
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
                            <div className="grid gap-4 md:hidden">
                                {paginatedUsers.map(user => (
                                    <Card key={user.id} className='flex flex-col'>
                                        <CardHeader>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">{user.full_name}</CardTitle>
                                                        <CardDescription>@{user.username}</CardDescription>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild><a href={`//${user.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer"><Globe className="mr-2 h-4 w-4" /> View Site</a></DropdownMenuItem>
                                                        <DropdownMenuItem asChild><Link href={`/dashboard/users/${user.id}/edit`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleBlockClick(user)} className="cursor-pointer">{user.subscription_status === 'active' ? <><ShieldOff className="mr-2 h-4 w-4" /> Block</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Unblock</>}</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <p><span className="font-medium text-foreground">Site:</span> {user.site_name}</p>
                                                <Badge variant={getStatusBadgeVariant(user.subscription_status)}>{user.subscription_status || 'N/A'}</Badge>
                                            </div>
                                            <p className="text-muted-foreground"><span className="font-medium text-foreground">Domain:</span> {user.domain}.{baseDomain}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No users found.</p>
                    )}
                </CardContent>
                 {users.length > USERS_PER_PAGE && (
                  <CardFooter className="justify-center">
                      <div className="flex items-center gap-4 text-sm">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                          <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                      </div>
                  </CardFooter>
                )}
            </Card>

            {/* Delete User Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user profile for <span className="font-bold">{selectedUser?.full_name}</span>. This action cannot be undone. This will only remove their site profile, not their authentication record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={performDelete} className={cn(buttonVariants({ variant: "destructive" }))} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Profile
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Block/Unblock User Alert */}
            <AlertDialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to <span className="font-bold">{selectedUser?.subscription_status === 'active' ? 'block' : 'unblock'}</span> the store for <span className="font-bold">{selectedUser?.full_name}</span>.
                            {selectedUser?.subscription_status === 'active' 
                                ? " This will set their subscription status to 'inactive' and may prevent them from accessing certain features."
                                : " This will set their subscription status to 'active'."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={performBlock} className={cn(buttonVariants({ variant: selectedUser?.subscription_status === 'active' ? "destructive" : "default" }))} disabled={isBlocking}>
                            {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedUser?.subscription_status === 'active' ? 'Block Store' : 'Unblock Store'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
