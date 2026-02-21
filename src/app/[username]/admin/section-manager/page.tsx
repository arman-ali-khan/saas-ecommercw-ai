
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
import type { Product, Section, Category, ProductAttribute } from '@/types';
import { ArrowUp, ArrowDown, Loader2, GripVertical, Plus, Trash2, X, Smartphone, LayoutGrid, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';

const CORE_SECTION_IDS = ['hero', 'categories', 'flash_deals', 'featured', 'why-us', 'customer-reviews'];

export default function SectionManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for new dynamic section
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('10000');
  const [newMobileView, setNewMobileView] = useState<'1-col' | '2-col' | 'list'>('2-col');

  const fetchAndBuildSections = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        const [productsRes, categoriesRes, attrRes, sectionsRes] = await Promise.all([
            fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) }),
            fetch('/api/categories/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) }),
            fetch('/api/attributes/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) }),
            fetch('/api/sections/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) })
        ]);

        const [productsData, categoriesData, attrData, sectionsData] = await Promise.all([
            productsRes.json(), categoriesRes.json(), attrRes.json(), sectionsRes.json()
        ]);

        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
        
        const tagList = (attrData.attributes as ProductAttribute[] || [])
            .filter(a => a.type === 'tag')
            .map(a => a.value);
        setTags(tagList);

        let currentSections: Section[] = [];
        if (sectionsData.sections) {
            currentSections = (sectionsData.sections as Section[]).map(s => ({
                ...s,
                mobileView: s.mobileView || '2-col'
            }));
            
            // Migration: Add categories if not present in existing sections
            if (!currentSections.find(s => s.id === 'categories')) {
                currentSections.splice(1, 0, { id: 'categories', title: 'Shop By Category', enabled: true, isCategorySection: false, mobileView: 'list' });
            }
        } else {
            // Default initial state for a new store
            currentSections = [
              { id: 'hero', title: 'Hero Carousel', enabled: true, isCategorySection: false, mobileView: '2-col' },
              { id: 'categories', title: 'Shop By Category', enabled: true, isCategorySection: false, mobileView: 'list' },
              { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false, mobileView: '2-col' },
              { id: 'featured', title: 'Featured Products', enabled: true, isCategorySection: false, mobileView: '2-col' },
              { id: 'why-us', title: 'Why We Are Different', enabled: true, isCategorySection: false, mobileView: '2-col' },
              { id: 'customer-reviews', title: 'Customer Reviews', enabled: true, isCategorySection: false, mobileView: '2-col' },
            ];
        }
        
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

  const handleMobileViewChange = (sectionId: string, view: '1-col' | '2-col' | 'list') => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, mobileView: view } : s))
    );
  };

  const handleRemoveSection = (id: string) => {
      setSections(prev => prev.filter(s => s.id !== id));
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

  const handleAddDynamicSection = () => {
      if (!newTitle) {
          toast({ variant: 'destructive', title: 'শিরোনাম প্রদান করুন' });
          return;
      }

      const newSection: Section = {
          id: `dynamic-${uuidv4().slice(0, 8)}`,
          title: newTitle,
          enabled: true,
          isCategorySection: true,
          category: newCategory && newCategory !== 'all' ? newCategory : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          minPrice: parseInt(minPrice) || 0,
          maxPrice: parseInt(maxPrice) || 50000,
          mobileView: newMobileView,
      };

      setSections(prev => [...prev, newSection]);
      setIsCreateOpen(false);
      setNewTitle('');
      setNewCategory('');
      setSelectedTags([]);
      setMinPrice('0');
      setMaxPrice('10000');
      setNewMobileView('2-col');
      toast({ title: 'সেকশন যোগ করা হয়েছে। দয়া করে পরিবর্তনগুলো সেভ করুন।' });
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
    <>
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Homepage Section Manager</h1>
                <p className="text-muted-foreground">Manage dynamic content sections on your storefront.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Dynamic Section
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
                            <div className="flex flex-col items-start text-left">
                                <span className="text-base font-semibold">
                                    {section.title}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge variant="outline" className="text-[10px] py-0 gap-1">
                                        <Smartphone className="h-2 w-2" /> {section.id === 'categories' && section.mobileView === 'list' ? '3 Columns' : (section.mobileView || '2-col')}
                                    </Badge>
                                    {section.isCategorySection && (
                                        <>
                                            {section.category && <Badge variant="secondary" className="text-[10px] py-0">{section.category}</Badge>}
                                            {section.tags?.map(t => <Badge key={t} variant="outline" className="text-[10px] py-0">{t}</Badge>)}
                                            {(section.minPrice !== undefined || section.maxPrice !== undefined) && <Badge variant="outline" className="text-[10px] py-0">৳{section.minPrice ?? 0}-{section.maxPrice ?? '∞'}</Badge>}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={section.enabled ? 'default' : 'outline'}>
                                {section.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-6 pt-2 border-t grid gap-6">
                        <div className="grid sm:grid-cols-2 gap-6">
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
                                    <Label htmlFor={`switch-${section.id}`} className="font-normal text-xs">
                                        {section.enabled ? "Section is enabled." : "Section is disabled."}
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile View Layout</Label>
                                <Select value={section.mobileView || '2-col'} onValueChange={(val: any) => handleMobileViewChange(section.id, val)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select Layout" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[110]">
                                        {section.id !== 'categories' && (
                                            <SelectItem value="1-col"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> 1 Column (Large)</div></SelectItem>
                                        )}
                                        <SelectItem value="2-col"><div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> 2 Columns (Grid)</div></SelectItem>
                                        <SelectItem value="list">
                                            <div className="flex items-center gap-2">
                                                {section.id === 'categories' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                                                {section.id === 'categories' ? '3 Columns (Grid)' : 'List View'}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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

                        {!CORE_SECTION_IDS.includes(section.id) && (
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveSection(section.id)} className="w-fit">
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Section
                            </Button>
                        )}
                    </div>
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 bg-muted/20 p-6 rounded-b-lg border-t">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="min-w-[150px]">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
        </CardFooter>
        </Card>
    </div>

    {/* Dynamic Section Modal */}
    {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
            <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h2 className="text-xl font-bold">নতুন ডাইনামিক সেকশন তৈরি করুন</h2>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsCreateOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                        <Label>সেকশন শিরোনাম (Title)</Label>
                        <Input 
                            placeholder="যেমন: সেরা অফার" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ক্যাটাগরি ফিল্টার (Optional)</Label>
                            <Select value={newCategory} onValueChange={setNewCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="সব ক্যাটাগরি" />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile View Layout</Label>
                            <Select value={newMobileView} onValueChange={(val: any) => setNewMobileView(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="2-col">2 Column Grid</SelectItem>
                                    <SelectItem value="1-col">1 Column Grid</SelectItem>
                                    <SelectItem value="list">List View</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>ট্যাগ ফিল্টার (Tags)</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/20">
                            {tags.length > 0 ? tags.map(tag => (
                                <div key={tag} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`tag-${tag}`} 
                                        checked={selectedTags.includes(tag)}
                                        onCheckedChange={(checked) => {
                                            setSelectedTags(prev => checked ? [...prev, tag] : prev.filter(t => t !== tag));
                                        }}
                                    />
                                    <label htmlFor={`tag-${tag}`} className="text-sm font-medium leading-none cursor-pointer">{tag}</label>
                                </div>
                            )) : <p className="text-xs text-muted-foreground col-span-2">কোনো ট্যাগ পাওয়া যায়নি।</p>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>মূল্য পরিসীমা (Price Range)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Min Price</span>
                                <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Max Price</span>
                                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>বাতিল</Button>
                    <Button onClick={handleAddDynamicSection} className="shadow-lg shadow-primary/20">
                        সেকশন যোগ করুন
                    </Button>
                </div>
            </div>
        </div>
    )}
    </>
  );
}
