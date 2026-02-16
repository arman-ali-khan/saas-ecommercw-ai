'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { ProductQna } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, CheckCircle, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function QnaAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [qna, setQna] = useState<ProductQna[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [itemToDelete, setItemToDelete] = useState<ProductQna | null>(null);
    const [itemToAnswer, setItemToAnswer] = useState<ProductQna | null>(null);
    const [answerText, setAnswerText] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('product_qna')
                .select('*, products(name, images)')
                .eq('site_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setQna(data as any[] || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching Q&A data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchData]);
    
    useEffect(() => {
        if (itemToAnswer) {
            setAnswerText(itemToAnswer.answer || '');
        }
    }, [itemToAnswer]);

    const handleAnswerSubmit = async () => {
        if (!itemToAnswer || !answerText.trim() || !user) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('product_qna')
                .update({ 
                    answer: answerText,
                    is_approved: true,
                    answerer_name: user.fullName
                })
                .eq('id', itemToAnswer.id);
            if (error) throw error;
            toast({ title: 'Answer submitted and approved!' });
            await fetchData();
            setItemToAnswer(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to submit answer', description: e.message });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error } = await supabase.from('product_qna').delete().eq('id', itemToDelete.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete question', description: error.message });
        } else {
            toast({ title: 'Question deleted.' });
            await fetchData();
        }
        setIsActionLoading(false);
        setItemToDelete(null);
    };

    const pendingQuestions = useMemo(() => qna.filter(q => !q.is_approved), [qna]);
    const approvedQuestions = useMemo(() => qna.filter(q => q.is_approved), [qna]);

    const QnaCard = ({ item }: { item: ProductQna }) => (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {item.products?.images?.[0]?.imageUrl && (
                            <Image src={item.products.images[0].imageUrl} alt={item.products.name} width={40} height={40} className="rounded-sm object-cover" />
                        )}
                        <div>
                            <CardTitle className="text-sm font-normal">{item.products?.name || 'Unknown Product'}</CardTitle>
                            <CardDescription className="text-xs">
                                Asked by <span className="font-semibold">{item.customer_name}</span> on {format(new Date(item.created_at), 'PP')}
                            </CardDescription>
                        </div>
                    </div>
                     <Badge variant={item.is_approved ? 'default' : 'secondary'}>
                        {item.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                    <p className="font-semibold text-sm mb-1">Question:</p>
                    <p className="text-muted-foreground">"{item.question}"</p>
                </div>
                {item.answer && (
                    <div>
                        <p className="font-semibold text-sm mb-1">Answer:</p>
                        <p className="text-primary/90">"{item.answer}"</p>
                    </div>
                )}
            </CardContent>
            <CardContent className="flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={() => setItemToAnswer(item)}>
                    <Edit className="mr-2 h-4 w-4" /> {item.is_approved ? 'Edit Answer' : 'Answer'}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Q&A Manager</h1>
                    <p className="text-muted-foreground">Review, answer, and approve customer questions.</p>
                </div>
            </div>

            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending <Badge className="ml-2">{pendingQuestions.length}</Badge></TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6">
                    {pendingQuestions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {pendingQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <p>No pending questions.</p>
                        </div>
                    )}
                </TabsContent>
                 <TabsContent value="approved" className="mt-6">
                    {approvedQuestions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {approvedQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <p>No approved questions yet.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            
            <Dialog open={!!itemToAnswer} onOpenChange={() => setItemToAnswer(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{itemToAnswer?.is_approved ? 'Edit Answer' : 'Answer Question'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-semibold">{itemToAnswer?.customer_name} asked about {itemToAnswer?.products?.name}:</p>
                            <p className="text-sm text-muted-foreground mt-1 italic">"{itemToAnswer?.question}"</p>
                        </div>
                        <Textarea 
                            placeholder="Type your answer here..." 
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAnswerSubmit} disabled={isActionLoading}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Answer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this question. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isActionLoading} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
