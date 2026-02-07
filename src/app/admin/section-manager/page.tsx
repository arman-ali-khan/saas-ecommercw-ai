'use client';

import { useMemo, useState } from 'react';
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
import { getProducts } from '@/lib/products';

type Section = {
  id: string;
  title: string;
  enabled: boolean;
};

export default function SectionManagerPage() {
  const { toast } = useToast();

  const products = getProducts();
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products]
  );

  const initialSections: Section[] = [
    { id: 'hero', title: 'Hero Carousel', enabled: true },
    { id: 'featured', title: 'Featured Products', enabled: true },
    ...categories.map((cat) => ({
      id: `category-${cat.toLowerCase()}`,
      title: `${cat} Section`,
      enabled: false,
    })),
    { id: 'about', title: 'About Us Snippet', enabled: true },
  ];

  const [sections, setSections] = useState<Section[]>(initialSections);

  const handleToggle = (sectionId: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled } : s))
    );
  };

  const handleSaveChanges = () => {
    console.log('Saving section configuration:', sections);
    toast({
      title: 'Success!',
      description: 'Homepage sections have been updated.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Section Manager</CardTitle>
        <CardDescription>
          Enable, disable, and reorder sections on your homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder (functionality coming soon).
        </p>
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <Label htmlFor={section.id} className="text-base">
                {section.title}
              </Label>
              <Switch
                id={section.id}
                checked={section.enabled}
                onCheckedChange={(checked) => handleToggle(section.id, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
