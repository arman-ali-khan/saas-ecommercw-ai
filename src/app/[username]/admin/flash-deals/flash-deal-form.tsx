
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import type { Product, FlashDeal } from '@/types';
import { format, addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import Link from 'next/link';


export const flashDealSchema = z.object({
  product_id: z.string().min(1, "Please select a product."),
  discount_price: z.coerce.number().positive("Discount price must be a positive number."),
  date_range: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  is_active: z.boolean().default(true),
});

type FlashDealFormData = z.infer<typeof flashDealSchema>;

interface FlashDealFormProps {
    isNew: boolean;
    initialData?: FlashDeal;
    products: Product[];
    deals: FlashDeal[];
    onSubmit: (data: FlashDealFormData) => Promise<void>;
    isSubmitting: boolean;
}

export default function FlashDealForm({ isNew, initialData, products, deals, onSubmit, isSubmitting }: FlashDealFormProps) {
    const router = useRouter();

    const form = useForm<FlashDealFormData>({
        resolver: zodResolver(flashDealSchema),
        defaultValues: isNew ? {
            product_id: '',
            discount_price: undefined,
            is_active: true,
            date_range: { from: new Date(), to: addDays(new Date(), 7) }
        } : {
            product_id: initialData?.product_id,
            discount_price: initialData?.discount_price,
            is_active: initialData?.is_active,
            date_range: {
                from: new Date(initialData?.start_date || new Date()),
                to: new Date(initialData?.end_date || addDays(new Date(), 7))
            }
        },
    });

    return (
        <div>
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/admin/flash-deals">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Flash Deals
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>{isNew ? 'Add New Flash Deal' : 'Edit Flash Deal'}</CardTitle>
                    <CardDescription>{isNew ? 'Create a new limited-time offer.' : 'Update the details for this deal.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="product_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isNew}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {products.map(p => <SelectItem key={p.id} value={p.id} disabled={!isNew && deals.some(d => d.product_id === p.id && d.id !== initialData?.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="discount_price" render={({ field }) => (<FormItem><FormLabel>Discount Price (BDT)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />

                            <FormField control={form.control} name="date_range" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Deal Duration</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                                                ) : (
                                                format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={field.value?.from}
                                            selected={field.value as DateRange}
                                            onSelect={field.onChange}
                                            numberOfMonths={2}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Activate Deal</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Deal'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
