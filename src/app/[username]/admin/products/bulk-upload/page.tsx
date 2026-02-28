'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/stores/useAdminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, ArrowLeft, CheckCircle2, AlertTriangle, FileText, X, Edit, Save, ImageIcon, Tags, Layers, Wand2, Info, BookOpen } from 'lucide-react';
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
      stock: headers.findIndex(h => h.toLowerCase() === 'stock'),
      images: headers.findIndex(h => h.toLowerCase() === 'images'),
      categories: headers.findIndex(h => h.toLowerCase() === 'categories'),
      tags: headers.findIndex(h => h.toLowerCase() === 'tags'),
      sku: headers.findIndex(h => h.toLowerCase() === 'sku'),
      featured: headers.findIndex(h => h.toLowerCase() === 'is featured?'),
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

      // WooCommerce often uses commas or pipes for multiple images
      const rawImages = data[hIdx.images] || '';
      const imageList = rawImages.split(/[,|]/).map(url => ({ imageUrl: url.trim(), imageHint: '' })).filter(img => img.imageUrl);

      const product = {
        name: name,
        price: parseFloat(data[hIdx.regularPrice]) || 0,
        stock: parseInt(data[hIdx.stock]) || 0,
        description: data[hIdx.shortDesc] || name,
        long_description: data[hIdx.longDesc] || '',
        categories: data[hIdx.categories] ? data[hIdx.categories].split(',').map(c => c.trim()) : [],
        tags: data[hIdx.tags] ? data[hIdx.tags].split(',').map(t => t.trim()) : [],
        is_featured: data[hIdx.featured] === '1' || data[hIdx.featured]?.toLowerCase() === 'yes',
        images: imageList,
        tempId: data[hIdx.sku] || `new-${i}`,
        unit: data[hIdx.weight] ? `${data[hIdx.weight]} KG` : '',
        origin: '',
        story: '',
        color: colors,
        size: sizes,
        custom_attributes: customAttributes
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
        mainImageUrl: p.images?.[0]?.imageUrl || ''
    });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editFormData) return;
    
    const updatedImages = [...(editFormData.images || [])];
    if (editFormData.mainImageUrl) {
        if (updatedImages.length > 0) {
            updatedImages[0].imageUrl = editFormData.mainImageUrl;
        } else {
            updatedImages.push({ imageUrl: editFormData.mainImageUrl, imageHint: '' });
        }
    }

    const newProducts = [...parsedProducts];
    newProducts[editingIndex] = {
        ...editFormData,
        categories: editFormData.categoriesStr.split(',').map((c: string) => c.trim()).filter(Boolean),
        tags: editFormData.tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean),
        images: updatedImages
    };
    
    setParsedProducts(newProducts);
    setEditingIndex(null);
    setEditFormData(null);
    toast({ title: 'Product updated locally' });
  };

  const handleUpload = async () => {
    if (!user || parsedProducts.length === 0) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/products/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId: user.id,
          products: parsedProducts 
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
              <Button variant="ghost" size="icon" onClick={() => { setFileName(''); setParsedProducts([]); }} disabled={isLoading} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>

            <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Review Parsed Products</CardTitle>
                <CardDescription>Click the edit button to adjust any product data before saving. Thumbnails will be taken from the first image found.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-16">Img</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProducts.map((p, i) => (
                        <TableRow key={i}>
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
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {p.categories.slice(0, 2).map((c: string) => <Badge key={c} variant="secondary" className="text-[8px] truncate max-w-[100px]">{c}</Badge>)}
                              {p.categories.length > 2 && <span className="text-[10px] font-bold">+{p.categories.length - 2}</span>}
                            </div>
                          </TableCell>
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
                            Ensure all prices and names are correct. Categories and attributes will be created automatically if they don't exist.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => { setFileName(''); setParsedProducts([]); }} disabled={isLoading} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button 
                            onClick={handleUpload} 
                            disabled={isLoading || isParsing || parsedProducts.length === 0} 
                            size="lg" 
                            className="flex-grow sm:flex-none px-12 rounded-xl h-14 text-lg font-black shadow-xl shadow-primary/20"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-5 w-5" /> Save and Publish {parsedProducts.length} Items</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-4xl rounded-[2rem] p-0 overflow-hidden border-2 shadow-2xl">
            <DialogHeader className="bg-muted/30 p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl"><Edit className="h-5 w-5 text-primary" /></div>
                    <DialogTitle className="text-xl font-bold">Edit Product Before Import</DialogTitle>
                </div>
            </DialogHeader>
            {editFormData && (
                <ScrollArea className="max-h-[75vh]">
                    <div className="space-y-8 p-8">
                        {/* Header Info */}
                        <div className="flex gap-8 items-start">
                            <div className="relative h-40 w-40 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden shrink-0 shadow-inner">
                                {editFormData.mainImageUrl ? (
                                    <Image src={editFormData.mainImageUrl} alt="Thumbnail" fill className="object-cover" unoptimized />
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="flex-grow space-y-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name" className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Product Name</Label>
                                    <Input 
                                        id="edit-name" 
                                        value={editFormData.name} 
                                        onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                                        className="h-12 rounded-xl text-lg font-medium"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-image" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Thumbnail URL</Label>
                                    <Input 
                                        id="edit-image" 
                                        value={editFormData.mainImageUrl} 
                                        onChange={e => setEditFormData({...editFormData, mainImageUrl: e.target.value})} 
                                        className="h-9 text-xs font-mono rounded-lg bg-muted/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-price" className="font-bold">Price (BDT)</Label>
                                <Input 
                                    id="edit-price" 
                                    type="number" 
                                    value={editFormData.price} 
                                    onChange={e => setEditFormData({...editFormData, price: parseFloat(e.target.value) || 0})} 
                                    className="h-12 rounded-xl font-black text-xl text-primary"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-stock" className="font-bold">Stock Quantity</Label>
                                <Input 
                                    id="edit-stock" 
                                    type="number" 
                                    value={editFormData.stock} 
                                    onChange={e => setEditFormData({...editFormData, stock: parseInt(e.target.value) || 0})} 
                                    className="h-12 rounded-xl font-bold"
                                />
                            </div>
                        </div>

                        {/* Classification */}
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
                                <Label className="font-bold flex items-center gap-2"><Tags className="h-4 w-4 text-primary" /> Tags</Label>
                                <Input 
                                    value={editFormData.tagsStr} 
                                    onChange={e => setEditFormData({...editFormData, tagsStr: e.target.value})} 
                                    placeholder="organic, fresh, rajshahi"
                                    className="h-12 rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Separate tags with commas.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="font-bold">Origin</Label>
                                <Input 
                                    value={editFormData.origin || ''} 
                                    onChange={e => setEditFormData({...editFormData, origin: e.target.value})} 
                                    placeholder="e.g., Rajshahi"
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-bold">Unit/Weight</Label>
                                <Input 
                                    value={editFormData.unit || ''} 
                                    onChange={e => setEditFormData({...editFormData, unit: e.target.value})} 
                                    placeholder="e.g., 5 KG"
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-desc" className="font-bold">Short Description</Label>
                                <Textarea 
                                    id="edit-desc" 
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

                            <div className="grid gap-2">
                                <Label className="font-bold">Our Story (Optional)</Label>
                                <Textarea 
                                    value={editFormData.story || ''} 
                                    onChange={e => setEditFormData({...editFormData, story: e.target.value})} 
                                    rows={3}
                                    className="rounded-xl resize-none shadow-inner"
                                    placeholder="Share the context of this product..."
                                />
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
