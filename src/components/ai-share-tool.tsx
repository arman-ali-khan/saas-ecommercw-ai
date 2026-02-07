'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Copy } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';

interface AiShareToolProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiShareTool({
  product,
  open,
  onOpenChange,
}: AiShareToolProps) {
  const [interests, setInterests] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setIsLoading(true);
    // This is a mock generation for demonstration purposes.
    // In a real application, you would call your GenAI flow here.
    setTimeout(() => {
      const post = `Love ${interests}? Then you'll be obsessed with ${product.name} from Bangla Naturals! 🌿 It's a taste of pure, natural goodness from ${product.origin}. ${product.description} Get yours now! #BanglaNaturals #${product.name.replace(/\s+/g, '')}`;
      setGeneratedPost(post);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" /> AI-Powered Share Tool
          </DialogTitle>
          <DialogDescription>
            Let our AI craft the perfect social media post to share{' '}
            {product.name} with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interests" className="text-right">
              Interests
            </Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="col-span-3"
              placeholder="e.g., healthy food, desserts"
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Post'}
          </Button>
          {generatedPost && (
            <div className="space-y-2">
              <Label>Generated Post:</Label>
              <Textarea value={generatedPost} readOnly rows={5} />
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="mr-2 h-4 w-4" /> Copy Text
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            AI can make mistakes. Check important info.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
