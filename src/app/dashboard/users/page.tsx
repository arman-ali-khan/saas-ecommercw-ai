'use client';

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
import { useEffect, useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type UserProfile = {
    id: string;
    username: string;
    full_name: string;
    domain: string;
    site_name: string;
    site_description: string;
};

const editUserSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters."),
    site_name: z.string().min(2, "Site name must be at least 2 characters."),
    site_description: z.string().optional(),
});


export default function UsersAdminPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof editUserSchema>>({
        resolver: zodResolver(editUserSchema),
    });

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('*');
            if (data) {
                setUsers(data);
            } else if (error) {
                toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
            }
            setLoading(false);
        }
        fetchUsers();
    }, [toast]);

    useEffect(() => {
        if (selectedUser) {
            form.reset({
                full_name: selectedUser.full_name,
                site_name: selectedUser.site_name,
                site_description: selectedUser.site_description || '',
            });
        }
    }, [selectedUser, form]);

    const handleEditClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    }

    const handleDeleteClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    }

    const onEditSubmit = async (values: z.infer<typeof editUserSchema>) => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        const { error } = await supabase
            .from('profiles')
            .update({ 
                full_name: values.full_name,
                site_name: values.site_name,
                site_description: values.site_description,
            })
            .eq('id', selectedUser.id);
        
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update user', description: error.message });
        } else {
            toast({ title: 'User updated successfully!' });
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...values } : u));
            setIsEditOpen(false);
            setSelectedUser(null);
        }
    }
    
    const performDelete = async () => {
        if (!selectedUser) return;
        
        const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete user profile', description: error.message });
        } else {
            toast({ title: 'User profile deleted!' });
            setUsers(users.filter(u => u.id !== selectedUser.id));
        }
        setIsDeleteOpen(false);
        setSelectedUser(null);
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
                                                <TableCell>{user.domain}.banglanaturals.site</TableCell>
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
                                                                <a href={`//${user.domain}.banglanaturals.site`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                                                                    <Globe className="mr-2 h-4 w-4" /> View Site
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditClick(user)} className="cursor-pointer">
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit User
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
                                            <p><span className="font-medium text-foreground">Domain:</span> {user.domain}.banglanaturals.site</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                 <a href={`//${user.domain}.banglanaturals.site`} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="mr-2 h-4 w-4" /> View
                                                 </a>
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
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

             {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update the details for {selectedUser?.full_name}.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="site_name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="site_description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Description</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

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
                        <AlertDialogAction onClick={performDelete} className={buttonVariants({ variant: "destructive" })}>
                            Delete Profile
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
