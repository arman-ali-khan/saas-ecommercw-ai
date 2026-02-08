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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Globe, Loader2 } from 'lucide-react';
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

type UserProfile = {
    id: string;
    username: string;
    full_name: string;
    domain: string;
    site_name: string;
    site_description: string;
};

export default function UsersAdminPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const [baseDomain, setBaseDomain] = useState('banglanaturals.site');

    const fetchUsersAndSettings = useCallback(async () => {
        setLoading(true);
        try {
            const usersPromise = supabase.from('profiles').select(`
                id,
                username,
                full_name,
                domain,
                site_name,
                site_description
            `);
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

    const performDelete = async () => {
        if (!selectedUser) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Failed to delete user profile', description: error.message });
            } else {
                toast({ title: 'User profile deleted!' });
                await fetchUsersAndSettings(); // Re-fetch data on success
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
            setSelectedUser(null);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Loading user data from the database...</CardDescription>
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
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all registered users.</CardDescription>
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
                                            <TableHead>Domain</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map(user => (
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
                                                <TableCell>{user.site_name}</TableCell>
                                                <TableCell>{user.domain}.{baseDomain}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                             <DropdownMenuItem asChild>
                                                                <a href={`//${user.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                                                                    <Globe className="mr-2 h-4 w-4" /> View Site
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/users/${user.id}/edit`} className="flex items-center cursor-pointer w-full">
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit User
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteClick(user)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete User
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
                                {users.map(user => (
                                    <Card key={user.id} className='flex flex-col'>
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                                                    <CardDescription>@{user.username}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-1 text-sm text-muted-foreground">
                                            <p><span className="font-medium text-foreground">Site:</span> {user.site_name}</p>
                                            <p><span className="font-medium text-foreground">Domain:</span> {user.domain}.{baseDomain}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                 <a href={`//${user.domain}.${baseDomain}`} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="mr-2 h-4 w-4" /> View
                                                 </a>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/users/${user.id}/edit`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No users found.</p>
                    )}
                </CardContent>
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
        </>
    )
}
