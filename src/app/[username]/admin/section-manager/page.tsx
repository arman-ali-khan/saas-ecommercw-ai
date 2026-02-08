
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
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
import { ArrowUp, ArrowDown, Loader2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Section = {
  id: string;
  title: string;
  enabled: boolean;
  isCategorySection: boolean;
  category?: string;
};

export default function SectionManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  const allCategories = useMemo(
    () => [...new Set(products.flatMap((p) => p.categories || []))],
    [products]
  );

  const fetchProductsAndBuildSections = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProductsAndBuildSections();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchProductsAndBuildSections]);

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
    setIsSaving(true);
    // Simulate async operation
    setTimeout(() => {
        console.log('Saving section configuration:', sections);
        toast({
        title: 'Success!',
        description: 'Homepage sections have been updated.',
        });
        setIsSaving(false);
    }, 1000);
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
              <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:bg-muted/50">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base font-semibold text-left">
                            {section.title}
                        </span>
                    </div>
                    <Badge variant={section.enabled ? 'default' : 'outline'}>
                        {section.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-6 pt-2 border-t grid gap-6">
                  <div className="space-y-2">
                        <Label>Enable/Disable Section</Label>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id={`switch-${section.id}`}
                                checked={section.enabled}
                                onCheckedChange={(checked) =>
                                handleToggle(section.id, checked)
                                }
                            />
                            <Label htmlFor={`switch-${section.id}`}>
                                {section.enabled ? "This section is currently enabled." : "This section is currently disabled."}
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Reorder Section</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={index === 0}
                                onClick={() => moveSection(index, 'up')}
                            >
                                <ArrowUp className="mr-2 h-4 w-4" /> Move Up
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={index === sections.length - 1}
                                onClick={() => moveSection(index, 'down')}
                            >
                                <ArrowDown className="mr-2 h-4 w-4" /> Move Down
                            </Button>
                        </div>
                    </div>

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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
