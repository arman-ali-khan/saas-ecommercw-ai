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
      const post = `${interests} ভালোবাসেন? তাহলে আপনি বাংলা ন্যাচারালস এর ${product.name} এর প্রতি আসক্ত হয়ে যাবেন! 🌿 এটি ${product.origin} থেকে আসা বিশুদ্ধ, প্রাকৃতিক ভালোর স্বাদ। ${product.description} এখনই আপনারটি সংগ্রহ করুন! #BanglaNaturals #${product.name.replace(/\s+/g, '')}`;
      setGeneratedPost(post);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: 'ক্লিপবোর্ডে কপি করা হয়েছে!',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" /> এআই-চালিত শেয়ার টুল
          </DialogTitle>
          <DialogDescription>
            আমাদের এআই-কে আপনার বন্ধুদের সাথে {product.name} শেয়ার করার জন্য নিখুঁত সোশ্যাল মিডিয়া পোস্ট তৈরি করতে দিন।
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interests" className="text-right">
              আগ্রহ
            </Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="col-span-3"
              placeholder="যেমন, স্বাস্থ্যকর খাবার, মিষ্টি"
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'তৈরি হচ্ছে...' : 'পোস্ট তৈরি করুন'}
          </Button>
          {generatedPost && (
            <div className="space-y-2">
              <Label>তৈরি করা পোস্ট:</Label>
              <Textarea value={generatedPost} readOnly rows={5} />
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="mr-2 h-4 w-4" /> লেখা কপি করুন
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            এআই ভুল করতে পারে। গুরুত্বপূর্ণ তথ্য যাচাই করুন।
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
