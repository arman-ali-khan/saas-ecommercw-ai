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
import { ArrowUp, ArrowDown, Loader2, GripVertical, Plus, Trash2, X, Smartphone, LayoutGrid, List, GalleryHorizontal, Layout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';

const CORE_SECTION_IDS = ['hero', 'categories', 'flash_deals', 'featured', 'why-us', 'customer-reviews'];

export default function SectionManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for new dynamic section
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState<string>('all');
  const [newOrigin, setNewOrigin] = useState<string>('all');
  const [newColor, setNewColor] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('50000');
  const [newMobileView, setNewMobileView] = useState<'1-col' | '2-col' | 'list'>('2-col');
  const [newProductLimit, setNewProductLimit] = useState<string>('8');

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

        const fetchedProducts = (productsData.products || []) as Product[];
        setProducts(fetchedProducts);
        setCategories(categoriesData.categories || []);
        
        const allAttributes = (attrData.attributes as ProductAttribute[] || []);
        setTags(allAttributes.filter(a => a.type === 'tag').map(a => a.value));
        setBrands(allAttributes.filter(a => a.type === 'brand').map(a => a.value));
        setColors(allAttributes.filter(a => a.type === 'color').map(a => a.value));
        
        // Extract unique origins from products
        const uniqueOrigins = Array.from(new Set(fetchedProducts.map(p => p.origin).filter(Boolean)));
        setOrigins(uniqueOrigins);

        let currentSections: Section[] = [];
        if (sectionsData.sections) {
            currentSections = (sectionsData.sections as Section[]).map(s => ({
                ...s,
                mobileView: s.mobileView || '2-col',
                isCarousel: s.isCarousel ?? (s.id === 'categories' || s.id === 'flash_deals'),
                productLimit: s.productLimit || (s.id === 'featured' ? 10 : (s.isCategorySection ? 8 : undefined))
            }));
            
            if (!currentSections.find(s => s.id === 'categories')) {
                currentSections.splice(1, 0, { id: 'categories', title: 'Shop By Category', enabled: true, isCategorySection: false, mobileView: 'list', isCarousel: true });
            }
        } else {
            currentSections = [
              { id: 'hero', title: 'Hero Carousel', enabled: true, isCategorySection: false, mobileView: '2-col' },
              { id: 'categories', title: 'Shop By Category', enabled: true, isCategorySection: false, mobileView: 'list', isCarousel: true },
              { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false, mobileView: '2-col', isCarousel: true },
              { id: 'featured', title: 'Featured Products', enabled: true, isCategorySection: false, mobileView: '2-col', productLimit: 10 },
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

  const handleLimitChange = (sectionId: string, limit: string) => {
    const val = parseInt(limit) || 0;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, productLimit: val } : s))
    );
  };

  const handleMobileViewChange = (sectionId: string, view: '1-col' | '2-col' | 'list') => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, mobileView: view } : s))
    );
  };

  const handleCarouselToggle = (sectionId: string, isCarousel: boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isCarousel } : s))
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
          category: newCategory !== 'all' ? newCategory : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          brand: newBrand !== 'all' ? newBrand : undefined,
          origin: newOrigin !== 'all' ? newOrigin : undefined,
          color: newColor !== 'all' ? newColor : undefined,
          minPrice: parseInt(minPrice) || 0,
          maxPrice: parseInt(maxPrice) || 50000,
          mobileView: newMobileView,
          productLimit: parseInt(newProductLimit) || 8,
      };

      setSections(prev => [...prev, newSection]);
      setIsCreateOpen(false);
      
      // Reset
      setNewTitle('');
      setNewCategory('all');
      setSelectedTags([]);
      setNewBrand('all');
      setNewOrigin('all');
      setNewColor('all');
      setMinPrice('0');
      setMaxPrice('10000');
      setNewMobileView('2-col');
      setNewProductLimit('8');
      
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

  if (isLoading && sections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-48 rounded-md" />
        </div>
        <Card>
            <CardContent className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-5 w-5" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-3 w-60" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
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
                <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:bg-primary/10 data-[state=open]:text-primary transition-all">
                    <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col items-start text-left">
                                <span className="text-base font-semibold">
                                    {section.title}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge variant="outline" className="text-[10px] py-0 gap-1">
                                        <Layout className="h-2 w-2" /> {section.isCarousel ? 'Carousel' : 'Grid'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] py-0 gap-1">
                                        <Smartphone className="h-2 w-2" /> {section.mobileView || 'Auto'}
                                    </Badge>
                                    {section.productLimit !== undefined && (
                                        <Badge variant="secondary" className="text-[10px] py-0">Limit: {section.productLimit}</Badge>
                                    )}
                                    {section.isCategorySection && (
                                        <>
                                            {section.category && <Badge variant="secondary" className="text-[10px] py-0">{section.category}</Badge>}
                                            {section.brand && <Badge variant="secondary" className="text-[10px] py-0">Brand: {section.brand}</Badge>}
                                            {section.origin && <Badge variant="secondary" className="text-[10px] py-0">Origin: {section.origin}</Badge>}
                                            {section.color && <Badge variant="secondary" className="text-[10px] py-0">Color: {section.color}</Badge>}
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
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Visibility</Label>
                                    <div className="flex items-center space-x-2 pt-1">
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

                                {(section.id === 'categories' || section.id === 'flash_deals' || section.id === 'featured' || section.isCategorySection) && (
                                    <div className="space-y-2">
                                        <Label>Carousel Mode</Label>
                                        <div className="flex items-center space-x-2 pt-1">
                                            <Switch
                                                id={`carousel-${section.id}`}
                                                checked={section.isCarousel}
                                                onCheckedChange={(checked) =>
                                                    handleCarouselToggle(section.id, checked)
                                                }
                                            />
                                            <Label htmlFor={`carousel-${section.id}`} className="font-normal text-xs">
                                                {section.isCarousel ? "Slider layout." : "Fixed grid layout."}
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile Layout (Non-Carousel)</Label>
                                    <Select 
                                        value={section.mobileView || '2-col'} 
                                        onValueChange={(val: any) => handleMobileViewChange(section.id, val)}
                                        disabled={section.isCarousel && section.id !== 'categories'}
                                    >
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
                                                    {section.id === 'categories' ? '3 Columns (List style grid)' : 'List View (Stacked)'}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {section.isCarousel && section.id !== 'categories' && (
                                        <p className="text-[10px] text-muted-foreground mt-1">Carousel mode handles its own layout on mobile.</p>
                                    )}
                                </div>

                                {(section.id === 'featured' || section.isCategorySection) && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">{section.id === 'featured' ? 'Initial Products to Show' : 'Products to Show'}</Label>
                                        <Input 
                                            type="number" 
                                            value={section.productLimit || ''} 
                                            onChange={(e) => handleLimitChange(section.id, e.target.value)} 
                                            className="h-9"
                                        />
                                        {section.id === 'featured' && <p className="text-[10px] text-muted-foreground">After this limit, a "Load More" button will appear.</p>}
                                    </div>
                                )}
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
                            <Label>ক্যাটাগরি ফিল্টার</Label>
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
                            <Label>ব্র্যান্ড ফিল্টার</Label>
                            <Select value={newBrand} onValueChange={setNewBrand}>
                                <SelectTrigger>
                                    <SelectValue placeholder="সব ব্র্যান্ড" />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="all">সব ব্র্যান্ড</SelectItem>
                                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>অরিজিন ফিল্টার</Label>
                            <Select value={newOrigin} onValueChange={setNewOrigin}>
                                <SelectTrigger>
                                    <SelectValue placeholder="সব অরিজিন" />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="all">সব অরিজিন</SelectItem>
                                    {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>কালার ফিল্টার</Label>
                            <Select value={newColor} onValueChange={setNewColor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="সব কালার" />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="all">সব কালার</SelectItem>
                                    {colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>পণ্য সংখ্যা (Limit)</Label>
                            <Input 
                                type="number" 
                                value={newProductLimit}
                                onChange={(e) => setNewProductLimit(e.target.value)}
                            />
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
