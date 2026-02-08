
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getProductsBySiteId } from '@/lib/products';
import { useAuth } from '@/stores/auth';
import type { Product } from '@/types';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

type Section = {
  id: string;
  title: string;
  enabled: boolean;
  isCategorySection: boolean;
  category?: string;
};

export default function SectionManagerPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);

  const allCategories = useMemo(
    () => [...new Set(products.flatMap((p) => p.categories || []))],
    [products]
  );

  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const fetchedProducts = await getProductsBySiteId(user.id);
        setProducts(fetchedProducts);

        const categories = [
          ...new Set(fetchedProducts.flatMap((p) => p.categories || [])),
        ];
        const initialSections: Section[] = [
          {
            id: 'hero',
            title: 'Hero Carousel',
            enabled: true,
            isCategorySection: false,
          },
          {
            id: 'featured',
            title: 'Featured Products',
            enabled: true,
            isCategorySection: false,
          },
          ...categories.map((cat) => ({
            id: `category-${cat.toLowerCase().replace(/\s+/g, '-')}`,
            title: `${cat} Section`,
            enabled: false,
            isCategorySection: true,
            category: cat,
          })),
          {
            id: 'about',
            title: 'About Us Snippet',
            enabled: true,
            isCategorySection: false,
          },
        ];
        setSections(initialSections);

        setIsLoading(false);
      };
      fetchProducts();
    }
  }, [user]);

  const handleToggle = (sectionId: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled } : s))
    );
  };

  const handleTitleChange = (sectionId: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleCategoryChange = (sectionId: string, newCategory: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, category: newCategory } : s))
    );
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setSections((prev) => {
      const newSections = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newSections.length) {
        return newSections;
      }
      const temp = newSections[index];
      newSections[index] = newSections[newIndex];
      newSections[newIndex] = temp;
      return newSections;
    });
  };

  const handleSaveChanges = () => {
    console.log('Saving section configuration:', sections);
    toast({
      title: 'Success!',
      description: 'Homepage sections have been updated.',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homepage Section Manager</CardTitle>
          <CardDescription>
            Enable, disable, and reorder sections on your homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Section Manager</CardTitle>
        <CardDescription>
          Enable, disable, and reorder sections on your homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-4">
          {sections.map((section, index) => (
            <AccordionItem
              value={section.id}
              key={section.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:bg-muted/50 flex-wrap">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, 'up');
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, 'down');
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Label
                      htmlFor={section.id}
                      className="text-base font-semibold cursor-pointer text-left"
                    >
                      {section.title}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 ml-auto pl-2">
                    <Switch
                      id={section.id}
                      checked={section.enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(section.id, checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* AccordionTrigger's default chevron will be next */}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-6 pt-2 border-t">
                  <div className="grid gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${section.id}`}>
                        Section Title
                      </Label>
                      <Input
                        id={`title-${section.id}`}
                        value={section.title}
                        onChange={(e) =>
                          handleTitleChange(section.id, e.target.value)
                        }
                      />
                    </div>
                    {section.isCategorySection && section.category && (
                      <div className="space-y-2">
                        <Label htmlFor={`category-${section.id}`}>
                          Category
                        </Label>
                        <Select
                          value={section.category}
                          onValueChange={(value) =>
                            handleCategoryChange(section.id, value)
                          }
                        >
                          <SelectTrigger id={`category-${section.id}`}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
