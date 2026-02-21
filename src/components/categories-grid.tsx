
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DynamicIcon from './dynamic-icon';
import type { Category, Section } from '@/types';
import { cn } from '@/lib/utils';

interface CategoriesGridProps {
  categories: Category[];
  section: Section;
}

export default function CategoriesGrid({ categories, section }: CategoriesGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isListMode = section.mobileView === 'list';
  const displayLimit = 6;
  const showButton = categories.length > displayLimit;
  
  const visibleCategories = isExpanded ? categories : categories.slice(0, displayLimit);

  return (
    <div className="space-y-8">
      <div className={cn(
        "grid gap-2 md:gap-4",
        isListMode 
          ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" // 3-col List Grid for mobile
          : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5" // Standard 2-col Grid for mobile
      )}>
        {visibleCategories.map(cat => (
          <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`}>
            <Card 
              className={cn(
                "overflow-hidden h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 border-2 group",
                isListMode && "rounded-2xl"
              )} 
              style={{ backgroundColor: cat.card_color || 'hsl(var(--card))' }}
            >
              <div className={cn("relative aspect-square w-full", isListMode ? "p-2" : "")}>
                {cat.image_url ? (
                  <Image 
                    src={cat.image_url} 
                    alt={cat.name} 
                    fill 
                    className={cn(
                      "object-cover transition-transform duration-500 group-hover:scale-110",
                      isListMode && "rounded-xl"
                    )} 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted rounded-xl">
                    <DynamicIcon 
                      name={cat.icon || 'Package'} 
                      className={cn(
                        "text-muted-foreground",
                        isListMode ? "h-6 w-6 sm:h-8 sm:w-8" : "h-10 w-10 sm:h-12 sm:w-12"
                      )} 
                    />
                  </div>
                )}
              </div>
              <div className={cn("mt-auto", isListMode ? "p-1.5 sm:p-2" : "p-3")}>
                <h3 className={cn(
                  "font-bold text-center truncate leading-tight",
                  isListMode ? "text-[10px] sm:text-xs" : "text-xs sm:text-base"
                )}>
                  {cat.name}
                </h3>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {showButton && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full px-8 shadow-sm"
          >
            {isExpanded ? (
              <><ChevronUp className="mr-2 h-4 w-4" /> কম দেখুন</>
            ) : (
              <><ChevronDown className="mr-2 h-4 w-4" /> আরও দেখুন</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
