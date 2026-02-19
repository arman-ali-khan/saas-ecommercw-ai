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
import { Wand2, Copy, Sparkles, CheckCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

interface AiShareToolProps {
  product: Product;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiShareTool({
  product,
  siteName,
  open,
  onOpenChange,
}: AiShareToolProps) {
  const [interests, setInterests] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslation();
  const { aiShare: t_ai } = t;

  const handleGenerate = () => {
    setIsLoading(true);
    
    // Create a dynamic post based on actual database info
    setTimeout(() => {
      const intro = interests 
        ? `${interests} প্রিয় মানুষদের জন্য দারুণ খবর! ` 
        : 'আপনি কি সেরা এবং বিশুদ্ধ প্রাকৃতিক পণ্যের সন্ধানে আছেন? ';
      
      const originPart = product.origin 
        ? `এটি সরাসরি ${product.origin} থেকে সংগৃহীত। ` 
        : '';

      const post = `${intro}

"${siteName}" আপনাদের জন্য নিয়ে এলো শতভাগ খাঁটি এবং প্রিমিয়াম কোয়ালিটির "${product.name}"। ${originPart}

✨ কেন আমাদের পণ্যটি সেরা?
- ${product.description}
- কোনো রকম কেমিক্যাল বা ভেজাল নেই
- সরাসরি উৎপাদনকারীর কাছ থেকে আপনার হাতে পৌঁছে দিচ্ছি

আপনার সুস্থ ও সুন্দর জীবনের জন্য আজই সংগ্রহ করুন।

অর্ডার করতে ভিজিট করুন আমাদের ওয়েবসাইট। 

#${siteName.replace(/\s+/g, '')} #NatureLover #PureProduct #HealthyLiving #${product.name.replace(/\s+/g, '')} #OrganicBD`;
      
      setGeneratedPost(post);
      setIsLoading(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: t_ai.copied,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="text-primary h-6 w-6" /> {t_ai.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t_ai.description.replace('{productName}', product.name)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="interests" className="text-sm font-semibold">
              {t_ai.labelInterests}
            </Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t_ai.placeholderInterests}
              className="h-11"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="w-full h-11 text-lg font-bold shadow-lg shadow-primary/20"
          >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t_ai.generating}
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t_ai.generateBtn}
                </>
            )}
          </Button>
          {generatedPost && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-primary flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> {t_ai.generatedLabel}
                </Label>
              </div>
              <div className="relative group">
                <Textarea 
                    value={generatedPost} 
                    readOnly 
                    rows={10} 
                    className="resize-none bg-muted/30 border-2 focus-visible:ring-0 p-4 text-sm leading-relaxed"
                />
                <Button 
                    onClick={handleCopy} 
                    variant="secondary" 
                    size="sm"
                    className="absolute bottom-3 right-3 shadow-md border"
                >
                    <Copy className="mr-2 h-4 w-4" /> {t_ai.copyBtn}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-col items-center gap-2">
          <Separator />
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t_ai.disclaimer}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
