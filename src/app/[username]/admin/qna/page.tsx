'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { ProductQna } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, Edit, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 9;

export default function QnaAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [qna, setQna] = useState<ProductQna[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentTab, setCurrentTab] = useState('pending');
    
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

    useEffect(() => {
        setCurrentPage(1);
    }, [currentTab]);

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

    const currentQuestions = currentTab === 'pending' ? pendingQuestions : approvedQuestions;
    const totalPages = Math.ceil(currentQuestions.length / ITEMS_PER_PAGE);
    const paginatedQuestions = useMemo(() => {
        return currentQuestions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [currentQuestions, currentPage]);

    const QnaCard = ({ item }: { item: ProductQna }) => (
        <Card className="flex flex-col h-full hover:border-primary/20 transition-colors border-2 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        {item.products?.images?.[0]?.imageUrl ? (
                            <Image src={item.products.images[0].imageUrl} alt={item.products.name} width={40} height={40} className="rounded-lg object-cover shrink-0 aspect-square border" />
                        ) : (
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0"><HelpCircle className="h-5 w-5 text-muted-foreground/40" /></div>
                        )}
                        <div className="min-w-0">
                            <CardTitle className="text-sm font-bold line-clamp-1">{item.products?.name || 'Unknown Product'}</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-black tracking-widest mt-1">
                                Asked by <span className="text-primary">{item.customer_name}</span>
                            </CardDescription>
                        </div>
                    </div>
                     <Badge variant={item.is_approved ? 'default' : 'secondary'} className="shrink-0 text-[10px] px-1.5 h-5">
                        {item.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="p-3 rounded-xl bg-muted/20 border-dashed border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Question:</p>
                    <p className="text-sm italic">"{item.question}"</p>
                </div>
                {item.answer && (
                    <div className="p-3 rounded-xl bg-primary/5 border-2 border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Answer:</p>
                        <p className="text-sm">"{item.answer}"</p>
                    </div>
                )}
            </CardContent>
            <div className="p-4 sm:p-6 pt-0 sm:pt-0 flex justify-between items-center mt-auto">
                <span className="text-[10px] text-muted-foreground font-bold">{format(new Date(item.created_at), 'PP')}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setItemToAnswer(item)}>
                        <Edit className="mr-2 h-3 w-3" /> {item.is_approved ? 'Edit Answer' : 'Answer'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );

    if (isLoading && qna.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-start px-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex gap-2 p-1 bg-muted/30 w-fit rounded-lg">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="flex flex-col h-full border-2">
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                                    <div className="space-y-2 flex-grow">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                                <Skeleton className="h-16 w-full rounded-xl" />
                                <Skeleton className="h-16 w-full rounded-xl" />
                            </CardContent>
                            <CardFooter className="p-4 sm:p-6 flex justify-between">
                                <Skeleton className="h-3 w-20" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-bold">Q&A Manager</h1>
                    <p className="text-muted-foreground">Review, answer, and approve customer questions.</p>
                </div>
            </div>

            <Tabs defaultValue="pending" onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/30 p-1 h-11 rounded-xl">
                    <TabsTrigger value="pending" className="rounded-lg">Pending <Badge className="ml-2 h-5 min-w-[20px] px-1 justify-center" variant="secondary">{pendingQuestions.length}</Badge></TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-lg">Approved <Badge className="ml-2 h-5 min-w-[20px] px-1 justify-center" variant="outline">{approvedQuestions.length}</Badge></TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {pendingQuestions.length > 0 ? (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-4 mt-12">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-full px-6">আগেরটি</Button>
                                    <div className="text-sm self-center font-bold">পৃষ্ঠা {currentPage} / {totalPages}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-full px-6">পরবর্তী</Button>
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="text-center py-24 text-muted-foreground border-2 rounded-[2rem] border-dashed border-border/50 bg-muted/5">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No pending questions found.</p>
                        </div>
                    )}
                </TabsContent>
                 <TabsContent value="approved" className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {approvedQuestions.length > 0 ? (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedQuestions.map(item => <QnaCard key={item.id} item={item} />)}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-4 mt-12">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-full px-6">আগেরটি</Button>
                                    <div className="text-sm self-center font-bold">পৃষ্ঠা {currentPage} / {totalPages}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-full px-6">পরবর্তী</Button>
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="text-center py-24 text-muted-foreground border-2 rounded-[2rem] border-dashed border-border/50 bg-muted/5">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No approved questions yet.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            
            <Dialog open={!!itemToAnswer} onOpenChange={() => setItemToAnswer(null)}>
                <DialogContent className="sm:max-w-[90vw] md:max-w-xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{itemToAnswer?.is_approved ? 'Edit Answer' : 'Answer Question'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{itemToAnswer?.customer_name} asked about {itemToAnswer?.products?.name}:</p>
                            <p className="text-sm italic text-foreground/80 leading-relaxed">"{itemToAnswer?.question}"</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Your Answer</label>
                            <Textarea 
                                placeholder="Type your professional answer here..." 
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                rows={5}
                                className="resize-none rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setItemToAnswer(null)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleAnswerSubmit} disabled={isActionLoading || !answerText.trim()} className="rounded-xl shadow-lg shadow-primary/20">
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Answer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full shrink-0"><Trash2 className="h-6 w-6" /></div>
                            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm">
                            This will permanently delete this question. This action cannot be undone and the customer will not receive an answer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isActionLoading} className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl shadow-lg shadow-destructive/20")}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
