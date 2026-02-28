'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/stores/useAdminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, ArrowLeft, CheckCircle2, AlertTriangle, FileText, X, Edit, Save, ImageIcon, Trash2, Package, CreditCard, Tag, Hash, BookOpen, Plus, Layers } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import RichTextEditor from '@/components/rich-text-editor';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

/**
 * Advanced WooCommerce CSV Product Bulk Uploader
 */

export default function BulkUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { invalidateEntity } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const results = [];

    const hIdx = {
      name: headers.findIndex(h => h.toLowerCase() === 'name'),
      regularPrice: headers.findIndex(h => h.toLowerCase() === 'regular price'),
      salePrice: headers.findIndex(h => h.toLowerCase() === 'sale price'),
      shortDesc: headers.findIndex(h => h.toLowerCase() === 'short description'),
      longDesc: headers.findIndex(h => h.toLowerCase() === 'description'),
      stock: headers.findIndex(h => h.toLowerCase() === 'stock' || h.toLowerCase() === 'inventory'),
      images: headers.findIndex(h => h.toLowerCase() === 'images'),
      categories: headers.findIndex(h => h.toLowerCase() === 'categories'),
      tags: headers.findIndex(h => h.toLowerCase() === 'tags'),
      sku: headers.findIndex(h => h.toLowerCase() === 'sku' || h.toLowerCase() === 'id'),
      featured: headers.findIndex(h => h.toLowerCase() === 'is featured?' || h.toLowerCase() === 'featured'),
      weight: headers.findIndex(h => h.toLowerCase().includes('weight')),
    };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const data = parseLine(lines[i]);
      
      const name = data[hIdx.name] || '';
      if (!name) continue;

      const customAttributes: Record<string, string[]> = {};
      const colors: string[] = [];
      const sizes: string[] = [];
      
      for (let j = 0; j < headers.length; j++) {
          const header = headers[j].toLowerCase();
          if (header.includes('attribute ') && header.includes(' name')) {
              const attrName = data[j];
              const attrValuesRaw = data[j + 1]; 
              if (attrName && attrValuesRaw) {
                  const values = attrValuesRaw.split(',').map(v => v.trim());
                  if (attrName.toLowerCase() === 'color') colors.push(...values);
                  else if (attrName.toLowerCase() === 'size') sizes.push(...values);
                  else customAttributes[attrName] = values;
              }
          }
      }

      const rawImages = data[hIdx.images] || '';
      const imageList = rawImages.split(/[,|]/).map(url => ({ imageUrl: url.trim(), imageHint: '' })).filter(img => img.imageUrl);

      const product = {
        name: name,
        price: parseFloat(data[hIdx.regularPrice]?.replace(/[^0-9.]/g, '')) || 0,
        stock: parseInt(data[hIdx.stock]?.replace(/[^0-9]/g, '')) || 0,
        description: data[hIdx.shortDesc] || name,
        long_description: data[hIdx.longDesc] || '',
        categories: data[hIdx.categories] ? data[hIdx.categories].split(',').map(c => c.trim()) : [],
        tags: data[hIdx.tags] ? data[hIdx.tags].split(',').map(t => t.trim()) : [],
        is_featured: data[hIdx.featured] === '1' || data[hIdx.featured]?.toLowerCase() === 'yes',
        images: imageList,
        tempId: data[hIdx.sku] || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        unit: data[hIdx.weight] ? `${data[hIdx.weight]} KG` : '',
        origin: '',
        story: '',
        color: colors,
        variants: [] 
      };

      results.push(product);
    }

    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setSelectedIndices([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      setParsedProducts(products);
      setIsParsing(false);
      toast({ title: `${products.length} products parsed!`, description: 'Please review the list before uploading.' });
    };
    reader.readAsText(file);
  };

  const handleEditClick = (index: number) => {
    const p = parsedProducts[index];
    setEditingIndex(index);
    setEditFormData({ 
        ...p,
        categoriesStr: p.categories.join(', '),
        tagsStr: p.tags.join(', '),
        use_variants: p.variants && p.variants.length > 0,
        images: JSON.parse(JSON.stringify(p.images || [])),
        variants: JSON.parse(JSON.stringify(p.variants || []))
    });
  };

  const addVariant = () => {
    const newVariants = [...(editFormData.variants || [])];
    newVariants.push({ unit: '', price: editFormData.price || 0, stock: editFormData.stock || 0 });
    setEditFormData({ ...editFormData, variants: newVariants, use_variants: true });
  };

  const removeVariant = (idx: number) => {
    const newVariants = (editFormData.variants || []).filter((_: any, i: number) => i !== idx);
    setEditFormData({ ...editFormData, variants: newVariants, use_variants: newVariants.length > 0 });
  };

  const removeImage = (idx: number) => {
    const newImages = (editFormData.images || []).filter((_: any, i: number) => i !== idx);
    setEditFormData({ ...editFormData, images: newImages });
  };

  const addImage = () => {
    const url = prompt('Enter Image URL:');
    if (url && url.startsWith('http')) {
        const newImages = [...(editFormData.images || [])];
        newImages.push({ imageUrl: url, imageHint: '' });
        setEditFormData({ ...editFormData, images: newImages });
    }
  };

  const saveEdit = () => {
    if (editingIndex === null || !editFormData) return;
    
    const newProducts = [...parsedProducts];
    newProducts[editingIndex] = {
        ...editFormData,
        categories: editFormData.categoriesStr.split(',').map((c: string) => c.trim()).filter(Boolean),
        tags: editFormData.tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean),
        variants: editFormData.use_variants ? editFormData.variants : []
    };
    
    setParsedProducts(newProducts);
    setEditingIndex(null);
    setEditFormData(null);
    toast({ title: 'Product updated locally' });
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIndices(parsedProducts.map((_, i) => i));
    } else {
        setSelectedIndices([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    const newProducts = parsedProducts.filter((_, i) => !selectedIndices.includes(i));
    setParsedProducts(newProducts);
    setSelectedIndices([]);
    toast({ title: `${selectedIndices.length} items removed from list.` });
  };

  const handleUpload = async () => {
    if (!user || parsedProducts.length === 0) return;
    
    const productsToUpload = selectedIndices.length > 0 
        ? parsedProducts.filter((_, i) => selectedIndices.includes(i))
        : parsedProducts;

    setIsLoading(true);

    try {
      const response = await fetch('/api/products/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId: user.id,
          products: productsToUpload 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ 
          title: 'Success!', 
          description: `${result.count} products have been imported successfully.` 
        });
        invalidateEntity('products');
        invalidateEntity('dashboard');
        router.push('/admin/products');
      } else {
        throw new Error(result.error || 'Bulk import failed');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const isAllSelected = parsedProducts.length > 0 && selectedIndices.length === parsedProducts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Products</Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="px-1">
          <h1 className="text-3xl font-bold font-headline">Bulk Product Import</h1>
          <p className="text-muted-foreground">Upload, review, and edit WooCommerce products before publishing them to your store.</p>
        </div>

        {!fileName ? (
          <Card className="border-2 border-dashed bg-muted/10 rounded-[2rem]">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-primary/10 p-6 rounded-full mb-6">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Select WooCommerce CSV File</h3>
              <p className="text-muted-foreground max-w-sm mb-8">Export your products from WordPress WooCommerce and upload the .csv file here.</p>
              <label className="cursor-pointer">
                <span className={cn("inline-flex items-center justify-center rounded-xl bg-primary px-10 h-12 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all")}>
                  Choose CSV File
                </span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border-2 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl"><FileText className="h-6 w-6 text-primary" /></div>
                <div>
                  <p className="font-bold">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{parsedProducts.length} products detected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedIndices.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="rounded-xl h-9 px-4">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedIndices.length})
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { setFileName(''); setParsedProducts([]); setSelectedIndices([]); }} disabled={isLoading} className="rounded-full"><X className="h-5 w-5" /></Button>
              </div>
            </div>

            <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Review Parsed Products</CardTitle>
                <CardDescription>Select products to import or edit details individually.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-12 text-center">
                            <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                        </TableHead>
                        <TableHead className="w-16">Img</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProducts.map((p, i) => (
                        <TableRow key={i} className={cn(selectedIndices.includes(i) && "bg-primary/5")}>
                          <TableCell className="text-center">
                            <Checkbox 
                                checked={selectedIndices.includes(i)}
                                onCheckedChange={() => handleToggleSelect(i)}
                            />
                          </TableCell>
                          <TableCell>
                              <div className="relative h-12 w-12 rounded-lg border bg-muted overflow-hidden">
                                  {p.images?.[0]?.imageUrl ? (
                                      <Image src={p.images[0].imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                                  ) : (
                                      <ImageIcon className="h-5 w-5 m-auto text-muted-foreground/30" />
                                  )}
                              </div>
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                              {p.name}
                              {p.unit && <span className="block text-[10px] text-muted-foreground">{p.unit}</span>}
                          </TableCell>
                          <TableCell className="text-primary font-black">{p.price.toFixed(2)} BDT</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(i)} className="h-9 w-9 rounded-full">
                                <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-[100] md:left-[220px] lg:left-[280px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="container max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 hidden sm:flex">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed max-w-md">
                            {selectedIndices.length > 0 
                                ? `You have selected ${selectedIndices.length} items to upload. Ensure all prices and details are correct.`
                                : `No items selected. Clicking save will upload ALL ${parsedProducts.length} items in the list.`
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => { setFileName(''); setParsedProducts([]); setSelectedIndices([]); }} disabled={isLoading} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button 
                            onClick={handleUpload} 
                            disabled={isLoading || isParsing || parsedProducts.length === 0} 
                            size="lg" 
                            className="flex-grow sm:flex-none px-12 rounded-xl h-14 text-lg font-black shadow-xl shadow-primary/20"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-5 w-5" /> {selectedIndices.length > 0 ? `Save & Publish ${selectedIndices.length} Items` : `Save & Publish All (${parsedProducts.length})`}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-5xl rounded-[2rem] p-0 overflow-hidden border-2 shadow-2xl">
            <DialogHeader className="bg-muted/30 p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl"><Edit className="h-5 w-5 text-primary" /></div>
                    <DialogTitle className="text-xl font-bold">Edit Product Before Import</DialogTitle>
                </div>
            </DialogHeader>
            {editFormData && (
                <ScrollArea className="max-h-[80vh]">
                    <div className="space-y-8 p-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name" className="font-bold flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Product Name</Label>
                                <Input 
                                    id="edit-name" 
                                    value={editFormData.name} 
                                    onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                                    className="h-12 rounded-xl text-lg font-medium"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-slug" className="font-bold flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /> Slug / SKU</Label>
                                <Input 
                                    id="edit-slug" 
                                    value={editFormData.tempId} 
                                    onChange={e => setEditFormData({...editFormData, tempId: e.target.value})} 
                                    className="h-12 rounded-xl font-mono text-xs bg-muted/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="font-bold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Product Gallery</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {editFormData.images?.map((img: any, idx: number) => (
                                    <div key={idx} className={cn("relative aspect-square rounded-xl border-2 overflow-hidden group", idx === 0 ? "border-primary" : "border-muted")}>
                                        <Image src={img.imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeImage(idx)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                        {idx === 0 && <Badge className="absolute top-1 left-1 text-[8px] h-4">Cover</Badge>}
                                    </div>
                                ))}
                                <button type="button" onClick={addImage} className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-[10px] font-bold mt-1">Add URL</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border-2 border-primary/10 bg-primary/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Pricing & Inventory</h3>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Use Multi-Price (Variants)</Label>
                                    <Switch checked={editFormData.use_variants} onCheckedChange={(val) => setEditFormData({...editFormData, use_variants: val})} />
                                </div>
                            </div>

                            {!editFormData.use_variants ? (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Base Price (BDT)</Label>
                                        <Input 
                                            type="number" 
                                            value={editFormData.price} 
                                            onChange={e => setEditFormData({...editFormData, price: parseFloat(e.target.value) || 0})} 
                                            className="h-12 rounded-xl font-black text-xl text-primary"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Total Stock</Label>
                                        <Input 
                                            type="number" 
                                            value={editFormData.stock} 
                                            onChange={e => setEditFormData({...editFormData, stock: parseInt(e.target.value) || 0})} 
                                            className="h-12 rounded-xl font-bold"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    {editFormData.variants?.map((v: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-3 gap-4 items-end p-4 border rounded-xl bg-background shadow-sm relative group">
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-black">Weight/Size</Label>
                                                <Input value={v.unit} onChange={e => {
                                                    const newVariants = [...editFormData.variants];
                                                    newVariants[idx].unit = e.target.value;
                                                    setEditFormData({...editFormData, variants: newVariants});
                                                }} placeholder="e.g. 5 KG" className="h-9" />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-black">Price</Label>
                                                <Input type="number" value={v.price} onChange={e => {
                                                    const newVariants = [...editFormData.variants];
                                                    newVariants[idx].price = parseFloat(e.target.value) || 0;
                                                    setEditFormData({...editFormData, variants: newVariants});
                                                }} className="h-9" />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-black">Stock</Label>
                                                <Input type="number" value={v.stock} onChange={e => {
                                                    const newVariants = [...editFormData.variants];
                                                    newVariants[idx].stock = parseInt(e.target.value) || 0;
                                                    setEditFormData({...editFormData, variants: newVariants});
                                                }} className="h-9" />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(idx)}><X className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full border-dashed"><Plus className="h-4 w-4 mr-2" /> Add Price Variant</Button>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="font-bold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Categories</Label>
                                <Input 
                                    value={editFormData.categoriesStr} 
                                    onChange={e => setEditFormData({...editFormData, categoriesStr: e.target.value})} 
                                    placeholder="Food, Fruit, Local"
                                    className="h-12 rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Separate categories with commas. Parent &gt; Child supported.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-bold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Tags</Label>
                                <Input 
                                    value={editFormData.tagsStr} 
                                    onChange={e => setEditFormData({...editFormData, tagsStr: e.target.value})} 
                                    placeholder="organic, fresh, rajshahi"
                                    className="h-12 rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Separate tags with commas.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label className="font-bold">Short Description</Label>
                                <Textarea 
                                    value={editFormData.description} 
                                    onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                                    rows={3}
                                    className="rounded-xl resize-none shadow-inner"
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label className="font-bold flex items-center gap-2 text-primary">
                                    <BookOpen className="h-4 w-4" /> Full Description (Rich Text)
                                </Label>
                                <div className="rounded-2xl border-2 overflow-hidden shadow-inner bg-background">
                                    <RichTextEditor 
                                        value={editFormData.long_description || ''} 
                                        onChange={val => setEditFormData({...editFormData, long_description: val})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            )}
            <DialogFooter className="bg-muted/30 p-6 border-t gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setEditingIndex(null)} className="rounded-xl h-12 px-8 font-bold">Cancel</Button>
                <Button onClick={saveEdit} className="rounded-xl h-12 px-10 shadow-lg shadow-primary/20 gap-2 font-black text-lg">
                    <Save className="h-5 w-5" /> Update Item
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
