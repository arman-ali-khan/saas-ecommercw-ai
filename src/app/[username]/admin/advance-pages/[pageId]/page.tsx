
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Editor, Frame, Element } from '@craftjs/core';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ArrowLeft, Layers, MousePointer2, Smartphone, Monitor } from 'lucide-react';
import Link from 'next/link';

// Builder Components (Nodes)
import { Container } from '@/components/builder/nodes/Container';
import { Text } from '@/components/builder/nodes/Text';
import { BuilderButton } from '@/components/builder/nodes/Button';
import { Toolbox } from '@/components/builder/Toolbox';
import { SettingsPanel } from '@/components/builder/SettingsPanel';
import { Topbar } from '@/components/builder/Topbar';

export default function AdvancePageEditor() {
  const { pageId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isNew = pageId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setTitle] = useState('New Design');
  const [pageSlug, setSlug] = useState('');
  const [json, setJson] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const fetchPage = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await fetch('/api/advance-pages/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId, siteId: user?.id }),
      });
      const result = await res.json();
      if (res.ok && result.page) {
        setTitle(result.page.title);
        setSlug(result.page.slug);
        setJson(result.page.data);
        setIsPublished(result.page.is_published);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, isNew, user]);

  useEffect(() => { if (user) fetchPage(); }, [user, fetchPage]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col">
      <Editor
        resolver={{
          Container,
          Text,
          BuilderButton,
        }}
      >
        <Topbar 
            title={pageTitle} 
            setTitle={setTitle}
            slug={pageSlug}
            setSlug={setSlug}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            pageId={isNew ? undefined : pageId as string}
            siteId={user?.id || ''}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Toolbox />
          
          <div className="flex-1 bg-muted/30 overflow-auto p-8 flex justify-center">
            <div className="w-full max-w-5xl min-h-screen bg-background shadow-2xl rounded-sm">
                <Frame data={json}>
                    <Element is={Container} padding={20} background="#ffffff" canvas>
                        <Text text="Drag components here to start designing your page!" fontSize={20} />
                    </Element>
                </Frame>
            </div>
          </div>

          <SettingsPanel />
        </div>
      </Editor>
    </div>
  );
}
