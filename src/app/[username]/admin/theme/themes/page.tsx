
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout, CheckCircle2, Eye } from 'lucide-react';
import Image from 'next/image';

export default function ThemesPage() {
  const themes = [
    {
      id: 'default',
      name: 'DokanBD Default',
      description: 'The classic DokanBD experience. Clean, fast, and optimized for conversions.',
      previewUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800',
      isActive: true,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start px-1">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" /> Store Themes
        </h1>
        <p className="text-muted-foreground text-sm">Choose and customize the look of your online store.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <Card key={theme.id} className={cn("overflow-hidden border-2 transition-all group", theme.isActive ? "border-primary ring-2 ring-primary/10 shadow-lg" : "hover:border-primary/20")}>
            <div className="relative aspect-video bg-muted border-b overflow-hidden">
              <Image 
                src={theme.previewUrl} 
                alt={theme.name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              {theme.isActive && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-lg">
                    <CheckCircle2 className="mr-1.5 h-3 w-3" /> Active
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="p-5">
              <CardTitle className="text-lg">{theme.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {theme.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-0 gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold" disabled>
                <Eye className="mr-2 h-3.5 w-3.5" /> Preview
              </Button>
              <Button className="flex-1 rounded-xl h-10 text-xs font-bold" disabled={theme.isActive}>
                {theme.isActive ? 'Active' : 'Apply Theme'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {/* Placeholder for future themes */}
        <div className="border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-muted/5 opacity-50 grayscale">
            <Layout className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-bold text-muted-foreground">More themes coming soon</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-widest font-black">Stay Tuned</p>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
