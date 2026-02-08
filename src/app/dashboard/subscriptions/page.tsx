'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, Edit, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const subscriptionSchema = z.object({
  id: z.string().optional(),
  user: z.string().min(1, 'User name is required'),
  plan: z.enum(['Free', 'Pro', 'Enterprise']),
  status: z.enum(['Active', 'Canceled']),
  nextBilling: z.date({
    required_error: 'Next billing date is required.',
  }),
});

type Subscription = z.infer<typeof subscriptionSchema>;

const initialSubscriptions: Subscription[] = [
  { id: '1', user: 'আরিফুল ইসলাম', plan: 'Pro', status: 'Active', nextBilling: new Date('2024-08-25') },
  { id: '2', user: 'সুমাইয়া খাতুন', plan: 'Free', status: 'Active', nextBilling: new Date() },
  { id: '3', user: 'রাশেদ আহমেদ', plan: 'Pro', status: 'Canceled', nextBilling: new Date('2024-07-30') },
  { id: '4', user: 'জান্নাতুল ফেরদৌস', plan: 'Enterprise', status: 'Active', nextBilling: new Date('2025-01-01') },
];

export default function SubscriptionsAdminPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  const form = useForm<Subscription>({
    resolver: zodResolver(subscriptionSchema),
  });

  useEffect(() => {
    if (isFormOpen) {
      form.reset(selectedSubscription || { user: '', plan: 'Free', status: 'Active', nextBilling: new Date() });
    }
  }, [isFormOpen, selectedSubscription, form]);

  const onSubmit = (data: Subscription) => {
    if (selectedSubscription && selectedSubscription.id) {
      // Update
      setSubscriptions(subs => subs.map(s => s.id === selectedSubscription.id ? { ...data, id: s.id } : s));
      toast({ title: 'Subscription Updated' });
    } else {
      // Create
      setSubscriptions(subs => [...subs, { ...data, id: Date.now().toString() }]);
      toast({ title: 'Subscription Created' });
    }
    setIsFormOpen(false);
    setSelectedSubscription(null);
  };

  const openForm = (subscription: Subscription | null) => {
    setSelectedSubscription(subscription);
    setIsFormOpen(true);
  };
  
  const openDeleteAlert = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!selectedSubscription) return;
    setSubscriptions(subs => subs.filter(s => s.id !== selectedSubscription.id));
    toast({ title: 'Subscription Deleted', variant: 'destructive' });
    setIsAlertOpen(false);
    setSelectedSubscription(null);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>View, create, edit, and manage all user subscriptions.</CardDescription>
            </div>
            <Button onClick={() => openForm(null)}>
                <Plus className="mr-2 h-4 w-4" /> Add Subscription
            </Button>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Billing Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.user}</TableCell>
                        <TableCell><Badge variant={sub.plan === 'Pro' ? 'default' : 'secondary'}>{sub.plan}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge>
                        </TableCell>
                        <TableCell>{format(sub.nextBilling, 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => openForm(sub)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteAlert(sub)} className="text-destructive">
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
                {subscriptions.map(sub => (
                  <Card key={sub.id}>
                      <CardHeader>
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <Avatar>
                                      <AvatarFallback>{sub.user.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <CardTitle className="text-lg">{sub.user}</CardTitle>
                                      <CardDescription>Next Billing: {format(sub.nextBilling, 'PPP')}</CardDescription>
                                  </div>
                              </div>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openForm(sub)}>
                                          <Edit className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openDeleteAlert(sub)} className="text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center pt-0">
                          <Badge variant={sub.plan === 'Pro' ? 'default' : 'secondary'}>{sub.plan}</Badge>
                          <Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">No subscriptions found.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="user" render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name</FormLabel>
                  <FormControl><Input placeholder="e.g., আরিফুল ইসলাম" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nextBilling" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Billing Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit">Save Subscription</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the subscription for {selectedSubscription?.user}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
