
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/lib/supabase/client';
import { ArrowUp, ArrowDown, Loader2, GripVertical, LayoutList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type LandingSection = {
  id: string;
  title: string;
  enabled: boolean;
};

const DEFAULT_SECTIONS: LandingSection[] = [
  { id: 'hero', title: 'Hero Section', enabled: true },
  { id: 'features', title: 'Features Grid', enabled: true },
  { id: 'showcase', title: 'Platform Showcase', enabled: true },
  { id: 'stats', title: 'Platform Stats', enabled: true },
  { id: 'pricing', title: 'Pricing Plans', enabled: true },
  { id: 'testimonial', title: 'Testimonials', enabled: true },
  { id: 'cta', title: 'Call to Action', enabled: true },
];

export default function SaasSectionManagerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<LandingSection[]>([]);

  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('saas_settings')
            .select('homepage_sections')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data?.homepage_sections && Array.isArray(data.homepage_sections)) {
            setSections(data.homepage_sections as LandingSection[]);
        } else {
            setSections(DEFAULT_SECTIONS);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching sections', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

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
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('saas_settings')
            .upsert({ 
                id: 1, 
                homepage_sections: sections 
            }, { onConflict: 'id' });

        if (error) throw error;

        toast({
            title: 'Success!',
            description: 'Landing page sections have been updated.',
        });
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
          <CardTitle>Landing Page Section Manager</CardTitle>
          <CardDescription>
            Enable, disable, and reorder sections on your platform's landing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landing Page Sections</h1>
          <p className="text-muted-foreground">Manage the structure of your platform's main page.</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                          <Label>Visibility</Label>
                          <div className="flex items-center space-x-2 pt-2">
                              <Switch
                                  id={`switch-${section.id}`}
                                  checked={section.enabled}
                                  onCheckedChange={(checked) =>
                                  handleToggle(section.id, checked)
                                  }
                              />
                              <Label htmlFor={`switch-${section.id}`} className="font-normal">
                                  {section.enabled ? "Visible on landing page" : "Hidden from landing page"}
                              </Label>
                          </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
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
                          Internal Name (for Dashboard)
                        </Label>
                        <Input
                          id={`title-${section.id}`}
                          value={section.title}
                          onChange={(e) =>
                            handleTitleChange(section.id, e.target.value)
                          }
                        />
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
