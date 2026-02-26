
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    Trash2, 
    Loader2, 
    Copy, 
    Maximize2, 
    ImageIcon, 
    X,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import ImageUploader from '@/components/image-uploader';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTitle as VisuallyHiddenTitle } from '@/components/ui/dialog';
import type { SiteImage } from '@/types';

export default function ImageGalleryAdminPage() {
    const { user } = useAuth();
    const { images, setImages } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => {
        const store = useAdminStore.getState();
        return store.images.length === 0;
    });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<SiteImage | null>(null);
    const [imageToDelete, setImageToDelete] = useState<SiteImage | null>(null);

    const fetchImages = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.images < 300000; // 5 mins
        
        if (!force && store.images.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/images/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setImages(result.images || []);
            } else {
                throw new Error(result.error || 'Failed to fetch images');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, setImages, toast]);

    useEffect(() => {
        if (user) fetchImages();
    }, [user, fetchImages]);

    const handleUploadSuccess = async (uploadRes: any) => {
        if (!user) return;
        setIsActionLoading(true);
        try {
            const response = await fetch('/api/images/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: user.id,
                    url: uploadRes.info.secure_url,
                    name: uploadRes.info.original_filename
                }),
            });
            if (response.ok) {
                toast({ title: 'Image saved to gallery!' });
                await fetchImages(true);
            } else {
                throw new Error('Failed to save image reference');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!imageToDelete || !user) return;
        setIsActionLoading(true);
        try {
            const response = await fetch('/api/images/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: imageToDelete.id, siteId: user.id }),
            });
            if (response.ok) {
                toast({ title: 'Image deleted from gallery.' });
                await fetchImages(true);
                setImageToDelete(null);
            } else {
                throw new Error('Delete failed');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsActionLoading(false);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: 'URL copied!', description: 'You can now paste it in product descriptions or pages.' });
    };

    if (isLoading && images.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Image Gallery</h1>
                    <p className="text-muted-foreground text-sm">Manage and reuse images across your site.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ImageUploader multiple onUpload={handleUploadSuccess} label="Upload to Gallery" />
                    {isActionLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
            </div>

            {images.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/10">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Your gallery is empty. Upload some images!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map((img) => (
                        <Card key={img.id} className="group relative aspect-square overflow-hidden border-2 rounded-xl bg-muted/20 hover:border-primary/40 transition-all shadow-sm">
                            <Image 
                                src={img.url} 
                                alt={img.name || 'Gallery image'} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <div className="flex gap-1">
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPreviewImage(img)} title="View Larger">
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => copyToClipboard(img.url)} title="Copy URL">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => setImageToDelete(img)} title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white/80 truncate w-full text-center px-2">{img.name}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-black/90 shadow-2xl rounded-2xl">
                    <VisuallyHiddenTitle className="sr-only">Image Preview</VisuallyHiddenTitle>
                    <div className="relative w-full aspect-video flex items-center justify-center">
                        {previewImage && (
                            <>
                                <Image src={previewImage.url} alt="Full view" fill className="object-contain" />
                                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-4 rounded-xl text-white flex justify-between items-center border border-white/10">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{previewImage.name}</p>
                                        <p className="text-[10px] opacity-70 uppercase tracking-widest">{format(new Date(previewImage.created_at), 'PPP')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={() => copyToClipboard(previewImage.url)}>
                                            <Copy className="mr-2 h-3 w-3" /> Copy URL
                                        </Button>
                                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" asChild>
                                            <a href={previewImage.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-3 w-3" /> Original</a>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full bg-black/20 text-white hover:bg-black/40" onClick={() => setPreviewImage(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            {imageToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isActionLoading && setImageToDelete(null)} />
                    <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                            <h3 className="text-xl font-bold">Delete this image?</h3>
                        </div>
                        <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This will remove the image from your gallery. If this image is used in product descriptions or pages, it will no longer display correctly.</p></div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <Button variant="outline" onClick={() => setImageToDelete(null)} disabled={isActionLoading}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isActionLoading}>
                                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Permanently
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
