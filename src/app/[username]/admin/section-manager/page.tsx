
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
import { useAuth } from '@/stores/auth';
import type { Product, Section } from '@/types';
import { ArrowUp, ArrowDown, Loader2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  const fetchAndBuildSections = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        // Fetch products via API
        const productsResponse = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const productsResult = await productsResponse.json();
        const fetchedProducts = productsResult.products || [];
        setProducts(fetchedProducts);

        // Fetch sections via API
        const sectionsResponse = await fetch('/api/sections/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const sectionsResult = await sectionsResponse.json();
        
        let currentSections: Section[] = [];
        if (sectionsResult.sections) {
            currentSections = (sectionsResult.sections as Section[]) || [];
        } else {
            const categories = [
              ...new Set(fetchedProducts.flatMap((p: Product) => p.categories || [])),
            ];
            currentSections = [
              {
                id: 'hero',
                title: 'Hero Carousel',
                enabled: true,
                isCategorySection: false,
              },
              {
                id: 'flash_deals',
                title: 'Flash Deals',
                enabled: true,
                isCategorySection: false,
              },
              {
                id: 'featured',
                title: 'Featured Products',
                enabled: true,
                isCategorySection: false,
              },
              {
                id: 'why-us',
                title: 'Why We Are Different',
                enabled: true,
                isCategorySection: false,
              },
              ...categories.map((cat) => ({
                id: `category-${cat.toLowerCase().replace(/\s+/g, '-')}`,
                title: `${cat} Section`,
                enabled: true,
                isCategorySection: true,
                category: cat,
              })),
            ];
        }
        
        // --- Backwards compatibility checks ---
        if (!currentSections.some(s => s.id === 'flash_deals')) {
            const heroIndex = currentSections.findIndex(s => s.id === 'hero');
            currentSections.splice(heroIndex !== -1 ? heroIndex + 1 : 0, 0, { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false });
        }
        if (!currentSections.some(s => s.id === 'customer-reviews')) {
            currentSections.push({ id: 'customer-reviews', title: 'Customer Reviews', enabled: true, isCategorySection: false });
        }
        // --- End backwards compatibility ---

        setSections(currentSections);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAndBuildSections();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchAndBuildSections]);

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

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
        const response = await fetch('/api/sections/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, sections }),
        });

        if (response.ok) {
            toast({
                title: 'Success!',
                description: 'Homepage sections have been updated.',
            });
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save sections');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving Changes', description: error.message });
    } finally {
        setIsSaving(false);
    }
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

                    {section.isCategorySection && (
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
