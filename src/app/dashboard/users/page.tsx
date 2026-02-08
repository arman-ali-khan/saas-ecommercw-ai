'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';


export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from('profiles').select('*');
            if (data) {
                setUsers(data);
            }
        }
        fetchUsers();
    }, []);
    
    return (
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
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
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
                                        <Button variant="outline" size="sm">
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm">
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
    )
}
