
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
import { Wand2, Copy, Sparkles } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

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
  const t = useTranslation();
  const { aiShare: t_ai } = t;

  const handleGenerate = () => {
    setIsLoading(true);
    // Simulation of AI generation logic
    setTimeout(() => {
      const interestsPart = interests ? `${interests} ভালোবাসেন? ` : 'প্রাকৃতিক পণ্যের খোঁজে আছেন? ';
      const post = `${interestsPart}তাহলে আপনি বাংলা ন্যাচারালস-এর "${product.name}" এর প্রতি আসক্ত হয়ে যাবেন! 🌿 

এটি ${product.origin || 'বাংলাদেশের সেরা উৎস'} থেকে আসা বিশুদ্ধ এবং প্রাকৃতিক স্বাদের এক অনন্য সম্ভার। 

✨ কেন কিনবেন?
- ${product.description}
- ১০০% প্রাকৃতিক ও স্বাস্থ্যসম্মত
- সরাসরি কৃষক থেকে সংগৃহীত

এখনই আপনারটি সংগ্রহ করতে ভিজিট করুন আমাদের ওয়েবসাইট। 

#BanglaNaturals #OrganicFood #HealthyLiving #${product.name.replace(/\s+/g, '')} #NatureLover`;
      
      setGeneratedPost(post);
      setIsLoading(false);
    }, 1500);
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
                    rows={8} 
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
