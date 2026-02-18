
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { ProductQna } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
            const response = await fetch('/api/qna/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            
            if (response.ok) {
                setQna(result.qna || []);
            } else {
                throw new Error(result.error);
            }
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
            const response = await fetch('/api/qna/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: itemToAnswer.id,
                    siteId: user.id,
                    answer: answerText,
                    is_approved: true,
                    answerer_name: user.fullName
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Answer submitted and approved!' });
                await fetchData();
                setItemToAnswer(null);
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to submit answer', description: e.message });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete || !user) return;
        setIsActionLoading(true);
        try {
            const response = await fetch('/api/qna/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: itemToDelete.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Question deleted.' });
                await fetchData();
            } else {
                const result = await response.json();
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to delete question', description: error.message });
        } finally {
            setIsActionLoading(false);
            setItemToDelete(null);
        }
    };

    const pendingQuestions = useMemo(() => qna.filter(q => !q.is_approved), [qna]);
    const approvedQuestions = useMemo(() => qna.filter(q => q.is_approved), [qna]);

    const QnaCard = ({ item }: { item: ProductQna }) => (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        {item.products?.images?.[0]?.imageUrl && (
                            <Image src={item.products.images[0].imageUrl} alt={item.products.name} width={40} height={40} className="rounded-sm object-cover shrink-0" />
                        )}
                        <div>
                            <CardTitle className="text-sm font-normal line-clamp-1">{item.products?.name || 'Unknown Product'}</CardTitle>
                            <CardDescription className="text-xs">
                                Asked by <span className="font-semibold">{item.customer_name}</span> on {format(new Date(item.created_at), 'PP')}
                            </CardDescription>
                        </div>
                    </div>
                     <Badge variant={item.is_approved ? 'default' : 'secondary'} className="shrink-0">
                        {item.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Question:</p>
                    <p className="text-sm">"{item.question}"</p>
                </div>
                {item.answer && (
                    <div>
                        <p className="font-semibold text-xs text-primary uppercase tracking-wider mb-1">Answer:</p>
                        <p className="text-sm text-muted-foreground italic">"{item.answer}"</p>
                    </div>
                )}
            </CardContent>
            <div className="p-6 pt-0 flex justify-end gap-2 mt-auto">
                 <Button variant="outline" size="sm" onClick={() => setItemToAnswer(item)}>
                    <Edit className="mr-2 h-4 w-4" /> {item.is_approved ? 'Edit Answer' : 'Answer'}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setItemToDelete(item)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
        </Card>
    );

    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
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
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="pending">Pending <Badge className="ml-2" variant="secondary">{pendingQuestions.length}</Badge></TabsTrigger>
                    <TabsTrigger value="approved">Approved <Badge className="ml-2" variant="outline">{approvedQuestions.length}</Badge></TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6">
                    {pendingQuestions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {pendingQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
                            <p>No pending questions found.</p>
                        </div>
                    )}
                </TabsContent>
                 <TabsContent value="approved" className="mt-6">
                    {approvedQuestions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {approvedQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
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
                        <div className="bg-muted/50 p-4 rounded-lg border">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{itemToAnswer?.customer_name} asked about {itemToAnswer?.products?.name}:</p>
                            <p className="text-sm italic">"{itemToAnswer?.question}"</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Answer</label>
                            <Textarea 
                                placeholder="Type your professional answer here..." 
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                rows={5}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setItemToAnswer(null)}>Cancel</Button>
                        <Button onClick={handleAnswerSubmit} disabled={isActionLoading || !answerText.trim()}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Answer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this question. This action cannot be undone and the customer will not receive an answer.</AlertDialogDescription>
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
