'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/stores/useAdminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, ArrowLeft, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * WooCommerce CSV Product Bulk Uploader
 * Parses WooCommerce standard CSV exports and maps them to eHut schema.
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

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Simple CSV parser that handles quoted strings with commas
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

    // Column mapping indices
    const idx = {
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
    };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const data = parseLine(lines[i]);
      
      const name = data[idx.name] || '';
      if (!name) continue;

      // Map to eHut Product Schema
      const product = {
        name: name,
        price: parseFloat(data[idx.regularPrice]) || 0,
        stock: parseInt(data[idx.stock]) || 0,
        description: data[idx.shortDesc] || name,
        long_description: data[idx.longDesc] || '',
        categories: data[idx.categories] ? data[idx.categories].split(',').map(c => c.trim()) : [],
        tags: data[idx.tags] ? data[idx.tags].split(',').map(t => t.trim()) : [],
        is_featured: data[idx.featured] === '1' || data[idx.featured]?.toLowerCase() === 'yes',
        images: data[idx.images] ? data[idx.images].split(',').map(url => ({ imageUrl: url.trim(), imageHint: '' })) : [],
        // Temporary ID generation for UI tracking
        tempId: data[idx.sku] || `new-${i}`
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

  const clearFile = () => {
    setFileName('');
    setParsedProducts([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Products</Link>
        </Button>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bulk Product Import</h1>
          <p className="text-muted-foreground">Upload a WooCommerce standard CSV export file to add multiple products at once.</p>
        </div>

        {!fileName ? (
          <Card className="border-2 border-dashed bg-muted/10">
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border-2 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl"><FileText className="h-6 w-6 text-primary" /></div>
                <div>
                  <p className="font-bold">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{parsedProducts.length} products detected</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} disabled={isLoading} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>

            <Card className="border-2 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Data Preview</CardTitle>
                <CardDescription>Review the first few products before confirming the import.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead>Images</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProducts.slice(0, 10).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold text-sm">{p.name}</TableCell>
                          <TableCell className="text-primary font-black">{p.price.toFixed(2)} BDT</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {p.categories.slice(0, 2).map((c: string) => <Badge key={c} variant="secondary" className="text-[8px]">{c}</Badge>)}
                              {p.categories.length > 2 && <span className="text-[10px]">+{p.categories.length - 2}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{p.images.length} images</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedProducts.length > 10 && (
                  <div className="p-4 bg-muted/10 text-center border-t italic text-xs text-muted-foreground">
                    ... and {parsedProducts.length - 10} more products.
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Importing a large number of products might take a moment. 
                    Unique identifiers (Slugs) will be generated automatically based on the product names.
                  </p>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={isLoading || isParsing} 
                  size="lg" 
                  className="w-full sm:w-auto px-12 rounded-xl h-14 text-lg font-black shadow-xl shadow-primary/20"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Importing...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Import {parsedProducts.length} Products</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
