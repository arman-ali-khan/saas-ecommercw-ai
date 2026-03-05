
'use client';
import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, ArrowLeft, Globe, Eye, Undo, Redo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const Topbar = ({ title, setTitle, slug, setSlug, isPublished, setIsPublished, pageId, siteId }: any) => {
  const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history(state).canUndo(),
    canRedo: query.history(state).canRedo(),
  }));
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    const data = query.serialize();
    
    try {
      const res = await fetch('/api/advance-pages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          siteId,
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          data,
          is_published: isPublished
        }),
      });

      if (res.ok) {
        toast({ title: 'Design Saved Successfully!' });
        if (!pageId) router.push('/admin/advance-pages');
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-16 bg-background border-b px-6 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/advance-pages"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex flex-col">
            <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="h-7 px-0 border-none shadow-none focus-visible:ring-0 font-bold text-base bg-transparent min-w-[200px]"
                placeholder="Enter Page Title"
            />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <span>/pages/</span>
                <input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)} 
                    className="bg-transparent border-none outline-none p-0 focus:text-primary"
                    placeholder="page-slug"
                />
            </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 border-r pr-4 mr-2">
            <Button variant="ghost" size="icon" disabled={!canUndo} onClick={() => actions.history.undo()}><Undo className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" disabled={!canRedo} onClick={() => actions.history.redo()}><Redo className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 px-4 py-1.5 rounded-full border">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Publish</Label>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="rounded-full px-6 shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save Design
        </Button>
      </div>
    </div>
  );
};
