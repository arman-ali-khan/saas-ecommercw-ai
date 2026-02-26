'use client';

import { useEffect, useState, useCallback, useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Control, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import type { Page, Product, SiteImage } from '@/types';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Heading2, Type, Image as ImageIcon, Link as LinkIcon, Youtube, Trash2, ArrowUp, ArrowDown, GripVertical, Palette, Columns, AlignLeft, AlignCenter, AlignRight, Plus, ShoppingBag, Clock, GalleryHorizontal, CalendarIcon, ChevronDown, Star, User, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/image-uploader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/rich-text-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const generateSlug = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

const blockBaseSchema = z.object({
  id: z.string(),
});

const headingBlockSchema = blockBaseSchema.extend({
  type: z.literal('heading'),
  level: z.number().min(1).max(3).default(2),
  text: z.string().min(1, 'Heading text cannot be empty.'),
  align: z.enum(['left', 'center', 'right']).default('left'),
});

const paragraphBlockSchema = blockBaseSchema.extend({
  type: z.literal('paragraph'),
  text: z.string().min(1, 'Paragraph text cannot be empty.'),
  align: z.enum(['left', 'center', 'right']).default('left'),
});

const imageBlockSchema = blockBaseSchema.extend({
  type: z.literal('image'),
  src: z.string().url('Image source must be a valid URL.'),
  alt: z.string().optional(),
});

const buttonBlockSchema = blockBaseSchema.extend({
  type: z.literal('button'),
  text: z.string().min(1, 'Button text is required.'),
  href: z.string().min(1, 'Button link is required.'),
  variant: z.enum(['default', 'secondary', 'outline', 'ghost', 'link']).default('default'),
});

const youtubeBlockSchema = blockBaseSchema.extend({
  type: z.literal('youtube'),
  videoId: z.string().min(1, 'YouTube Video ID is required.'),
});

const coloredBoxBlockSchema = blockBaseSchema.extend({
    type: z.literal('coloredBox'),
    color: z.string().optional().default('hsl(var(--card))'),
    text: z.string().min(1, 'Text cannot be empty.')
});

const productShowcaseBlockSchema = blockBaseSchema.extend({
  type: z.literal('product_showcase'),
  main_product_id: z.string().optional(),
  main_product_unit: z.string().optional(),
  optional_product_ids: z.array(z.string()).default([]),
  also_buy_title: z.string().optional(),
});

const countdownBlockSchema = blockBaseSchema.extend({
    type: z.literal('countdown'),
    title: z.string().optional(),
    endDate: z.date({ required_error: "End date is required." }),
});

const reviewItemSchema = z.object({
  id: z.string(),
  reviewer_name: z.string().min(1, 'Reviewer name is required.'),
  reviewer_image: z.string().url('A valid image URL is required.').optional().or(z.literal('')),
  rating: z.number().min(1).max(5).default(5),
  social_platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'none']).default('none'),
  message: z.string().min(1, 'Review message is required.'),
});

const reviewBlockSchema = blockBaseSchema.extend({
  type: z.literal('review'),
  reviews: z.array(reviewItemSchema).default([]),
});

const carouselSlideSchema = z.object({
    id: z.string(),
    image: z.string().url('A valid image URL is required.'),
    title: z.string().optional().or(z.literal('')),
    subtitle: z.string().optional().or(z.literal('')),
});

const carouselBlockSchema = blockBaseSchema.extend({
    type: z.literal('carousel'),
    slides: z.array(carouselSlideSchema).default([]),
});

const baseBlockSchema: z.ZodType<any> = z.lazy(() => blockSchema);

const columnSchema = z.object({
    id: z.string(),
    blocks: z.array(baseBlockSchema)
});

const layoutBlockSchema = blockBaseSchema.extend({
    type: z.literal('layout'),
    columnCount: z.number().min(1).max(3),
    columns: z.array(columnSchema),
});

const blockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  youtubeBlockSchema,
  coloredBoxBlockSchema,
  layoutBlockSchema,
  productShowcaseBlockSchema,
  countdownBlockSchema,
  carouselBlockSchema,
  reviewBlockSchema,
]);

const pageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  content: z.array(blockSchema).default([]),
  is_published: z.boolean().default(false),
});

type PageFormData = z.infer<typeof pageFormSchema>;

const themeColorPalette = {
    'Background': 'hsl(var(--background))',
    'Foreground': 'hsl(var(--foreground))',
    'Card': 'hsl(var(--card))',
    'Popover': 'hsl(var(--popover))',
    'Primary': 'hsl(var(--primary))',
    'Secondary': 'hsl(var(--secondary))',
    'Muted': 'hsl(var(--muted))',
    'Accent': 'hsl(var(--accent))',
    'Destructive': 'hsl(var(--destructive))',
}

const defaultColorPalette = [
    { name: 'Navy', color: '#172554' },
    { name: 'Green', color: '#064e3b' },
    { name: 'Red', color: '#7f1d1d' },
    { name: 'Amber', color: '#854d0e' },
    { name: 'Indigo', color: '#1e1b4b' },
    { name: 'Fuchsia', color: '#4a044e' },
    { name: 'Slate', color: '#334155' },
    { name: 'Stone', color: '#44403c' },
];

export default function ManagePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { images: galleryImages, setImages } = useAdminStore();
  const pageId = params.pageId as string;
  const isNew = pageId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerPath, setPickerPath] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const IMAGES_PER_PAGE = 8;

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: { title: '', slug: '', content: [], is_published: false },
  });

  const openPicker = (path: string) => {
    setPickerPath(path);
    setIsPickerOpen(true);
  };

  const ProductSelector = ({ control, namePrefix, allProducts, productIdsFieldName = "product_ids", label = "Select Products" }: { control: Control<PageFormData>, namePrefix: string, allProducts: Product[], productIdsFieldName?: string, label?: string }) => {
      const { field: selectionField } = useController({ control, name: `${namePrefix}.${productIdsFieldName}` as any });
      const selectedIds = selectionField.value || [];
  
      const handleToggle = (productId: string) => {
          const newIds = selectedIds.includes(productId)
              ? selectedIds.filter((id: string) => id !== productId)
              : [...selectedIds, productId];
          selectionField.onChange(newIds);
      };
  
      return (
          <div>
              <Label>{label}</Label>
              <ScrollArea className="h-48 mt-2 rounded-md border">
                  <div className="p-4 space-y-2">
                      {allProducts.length > 0 ? allProducts.map(product => (
                          <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                  id={`product-${namePrefix}-${productIdsFieldName}-${product.id}`}
                                  checked={selectedIds.includes(product.id)}
                                  onCheckedChange={() => handleToggle(product.id)}
                              />
                              <Label htmlFor={`product-${namePrefix}-${productIdsFieldName}-${product.id}`} className="font-normal">{product.name}</Label>
                          </div>
                      )) : <p className="text-sm text-muted-foreground text-center">No products found.</p>}
                  </div>
              </ScrollArea>
          </div>
      );
  };
  
    const CarouselBlockEditor = ({ namePrefix, control }: { namePrefix: string, control: Control<PageFormData> }) => {
        const { fields: slideFields, append: appendSlide, remove: removeSlide, move: moveSlide } = useFieldArray({
            control,
            name: `${namePrefix}.slides` as any,
        });

        const addSlide = () => {
            appendSlide({ id: uuidv4(), image: 'https://placehold.co/1200x600?text=New+Slide', title: '', subtitle: '' });
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slideFields.map((slide, index) => (
                        <Card key={slide.id} className="p-3 bg-background/50 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-3">
                                <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Slide {index + 1}</p>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, index - 1)} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, index + 1)} disabled={index === slideFields.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSlide(index)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <div className="space-y-3 flex-grow">
                                <FormField control={control} name={`${namePrefix}.slides.${index}.image`} render={({ field: imgField }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black">Image</FormLabel>
                                        <div className="space-y-2">
                                            <div className="relative aspect-video rounded-md border bg-muted overflow-hidden">
                                                {imgField.value ? <Image src={imgField.value} alt="Preview" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">No Image</div>}
                                            </div>
                                            <div className="flex gap-2">
                                                <FormControl><Input {...imgField} className="h-8 text-[10px]" /></FormControl>
                                                <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => openPicker(`${namePrefix}.slides.${index}.image`)}><ImageIcon className="h-3 w-3 mr-1" /> Gallery</Button>
                                            </div>
                                            <ImageUploader onUpload={(res) => form.setValue(`${namePrefix}.slides.${index}.image` as any, res.info.secure_url)} label="Upload New" />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name={`${namePrefix}.slides.${index}.title`} render={({ field: titleField }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black">Title (Optional)</FormLabel>
                                        <FormControl><Input {...titleField} className="h-8 text-xs" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name={`${namePrefix}.slides.${index}.subtitle`} render={({ field: subField }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black">Subtitle (Optional)</FormLabel>
                                        <FormControl><Input {...subField} className="h-8 text-xs" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </Card>
                    ))}
                </div>
                <Button type="button" variant="outline" onClick={addSlide} className="w-full border-dashed"><Plus className="mr-2 h-4 w-4" /> Add Slide</Button>
            </div>
        )
    }

    const ReviewsCarouselEditor = ({ namePrefix, control }: { namePrefix: string, control: Control<PageFormData> }) => {
        const { fields: reviewFields, append: appendReview, remove: removeReview, move: moveReview } = useFieldArray({
            control,
            name: `${namePrefix}.reviews` as any,
        });

        const addReview = () => {
            appendReview({ id: uuidv4(), reviewer_name: 'New Reviewer', reviewer_image: '', rating: 5, social_platform: 'none', message: 'Enter your review text here.' });
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviewFields.map((item, index) => {
                        const currentReviewPath = `${namePrefix}.reviews.${index}`;
                        return (
                            <Card key={item.id} className="p-4 bg-background/50 flex flex-col h-full relative">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Review {index + 1}</p>
                                    <div className="flex items-center gap-1">
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveReview(index, index - 1)} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveReview(index, index + 1)} disabled={index === reviewFields.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeReview(index)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-12 w-12 shrink-0 rounded-full border bg-muted overflow-hidden cursor-pointer" onClick={() => openPicker(`${currentReviewPath}.reviewer_image`)}>
                                            {form.watch(`${currentReviewPath}.reviewer_image` as any) ? (
                                                <Image src={form.watch(`${currentReviewPath}.reviewer_image` as any)} alt="Reviewer" fill className="object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <FormField control={control} name={`${currentReviewPath}.reviewer_name`} render={({ field: rnField }) => (<FormControl><Input {...rnField} placeholder="Reviewer Name" className="h-8 text-xs font-bold" /></FormControl>)} />
                                            <div className="flex gap-1">
                                                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => openPicker(`${currentReviewPath}.reviewer_image`)}>Gallery</Button>
                                                <ImageUploader onUpload={(res) => form.setValue(`${currentReviewPath}.reviewer_image` as any, res.info.secure_url)} label="Upload" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField control={control} name={`${currentReviewPath}.rating`} render={({ field: rtField }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black">Rating</FormLabel>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={cn("h-4 w-4 cursor-pointer", rtField.value >= star ? "text-primary fill-primary" : "text-muted-foreground/30")}
                                                            onClick={() => rtField.onChange(star)}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )} />
                                        <FormField control={control} name={`${currentReviewPath}.social_platform`} render={({ field: spField }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black">Icon</FormLabel>
                                                <Select onValueChange={spField.onChange} value={spField.value}>
                                                    <FormControl><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent className="z-[110]">
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="facebook">Facebook</SelectItem>
                                                        <SelectItem value="twitter">Twitter</SelectItem>
                                                        <SelectItem value="instagram">Instagram</SelectItem>
                                                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                        <SelectItem value="youtube">YouTube</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={control} name={`${currentReviewPath}.message`} render={({ field: mField }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase font-black">Review Message</FormLabel>
                                            <FormControl><Textarea {...mField} rows={3} className="text-xs resize-none" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </Card>
                        )
                    })}
                </div>
                <Button type="button" variant="outline" onClick={addReview} className="w-full border-dashed"><Plus className="mr-2 h-4 w-4" /> Add Another Review</Button>
            </div>
        )
    }

  const BlockEditor = ({ control, namePrefix, allProducts }: { control: Control<PageFormData>, namePrefix: string, allProducts: Product[] }) => {
      const { fields: editorFields, append: appendBlock, remove: removeBlock, move: moveBlock } = useFieldArray({
          control,
          name: namePrefix as any,
      });
  
      const addBlock = (type: 'heading' | 'paragraph' | 'image' | 'button' | 'youtube' | 'coloredBox' | 'layout' | 'product_showcase' | 'countdown' | 'carousel' | 'review', columnCount?: number) => {
          const id = uuidv4();
          let newBlock: any;
  
          switch (type) {
              case 'heading': newBlock = { id, type: 'heading', level: 2, text: 'Your Heading', align: 'left' }; break;
              case 'paragraph': newBlock = { id, type: 'paragraph', text: 'Start writing your paragraph here.', align: 'left' }; break;
              case 'image': newBlock = { id, type: 'image', src: 'https://placehold.co/1200x600?text=Your+Image', alt: 'Placeholder Image' }; break;
              case 'button': newBlock = { id, type: 'button', text: 'Click Me', href: '#', variant: 'default' }; break;
              case 'youtube': newBlock = { id, type: 'youtube', videoId: 'dQw4w9WgXcQ' }; break;
              case 'coloredBox': newBlock = { id, type: 'coloredBox', color: 'hsl(var(--card))', text: 'This is a colored box.' }; break;
              case 'layout': newBlock = { id, type: 'layout', columnCount, columns: Array.from({ length: columnCount || 1 }, () => ({ id: uuidv4(), blocks: [] })) }; break;
              case 'product_showcase': newBlock = { id, type: 'product_showcase', optional_product_ids: [], also_buy_title: 'Also Buy' }; break;
              case 'countdown': newBlock = { id, type: 'countdown', title: 'Countdown', endDate: new Date() }; break;
              case 'carousel': newBlock = { id, type: 'carousel', slides: [] }; break;
              case 'review': newBlock = { id, type: 'review', reviews: [] }; break;
          }
          appendBlock(newBlock);
      };
  
      return (
          <div className="space-y-4">
              {editorFields.map((field, index) => {
                  const currentFieldName = `${namePrefix}.${index}`;
                  if ((field as any).type === 'layout') {
                      const layout = field as any;
                      return (
                          <Card key={field.id} className="p-4 bg-muted/20">
                              <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Columns className="h-5 w-5" /> Layout: <span className="capitalize text-foreground">{layout.columnCount} Column</span></div>
                                  <div className="flex items-center gap-2">
                                      <Button type="button" size="icon" variant="ghost" onClick={() => moveBlock(index, index - 1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                      <Button type="button" size="icon" variant="ghost" onClick={() => moveBlock(index, index + 1)} disabled={index === editorFields.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                      <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeBlock(index)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                              </div>
                              <div className={`grid grid-cols-1 md:grid-cols-${layout.columnCount} gap-4`}>
                                  {layout.columns.map((col: any, colIndex: number) => (
                                      <div key={col.id} className="bg-background/50 p-3 rounded-lg border-dashed border">
                                          <BlockEditor control={control} namePrefix={`${currentFieldName}.columns.${colIndex}.blocks`} allProducts={allProducts} />
                                      </div>
                                  ))}
                              </div>
                          </Card>
                      );
                  }
                  
                  return (
                      <Card key={field.id} className="p-4 bg-muted/20">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><GripVertical className="cursor-grab h-5 w-5" /> Block: <span className="capitalize text-foreground">{(field as any).type.replace('_', ' ')}</span></div>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="ghost" onClick={() => moveBlock(index, index - 1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                              <Button type="button" size="icon" variant="ghost" onClick={() => moveBlock(index, index + 1)} disabled={index === editorFields.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                              <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeBlock(index)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <div className="space-y-4">
                              {(field as any).type === 'heading' && (
                                  <>
                                      <FormField control={control} name={`${currentFieldName}.text`} render={({ field: hField }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Input {...hField} /></FormControl><FormMessage /></FormItem>)} />
                                      <FormField control={control} name={`${currentFieldName}.align`} render={({ field: hAlignField }) => (<FormItem><FormLabel>Alignment</FormLabel><Select onValueChange={hAlignField.onChange} defaultValue={hAlignField.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="left"><AlignLeft className="inline-block mr-2 h-4 w-4"/>Left</SelectItem><SelectItem value="center"><AlignCenter className="inline-block mr-2 h-4 w-4"/>Center</SelectItem><SelectItem value="right"><AlignRight className="inline-block mr-2 h-4 w-4"/>Right</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                  </>
                              )}
                              {(field as any).type === 'paragraph' && (
                                  <>
                                      <FormField control={control} name={`${currentFieldName}.text`} render={({ field: pField }) => (
                                          <FormItem>
                                              <FormLabel>Text</FormLabel>
                                              <FormControl>
                                                  <RichTextEditor value={pField.value || ''} onChange={pField.onChange} />
                                              </FormControl>
                                              <FormMessage />
                                          </FormItem>
                                      )} />
                                  </>
                              )}
                              {(field as any).type === 'image' && (
                                  <>
                                  <FormField control={control} name={`${currentFieldName}.src`} render={({ field: iField }) => (<FormItem><FormLabel>Image URL</FormLabel><div className="flex gap-2"><FormControl><Input {...iField} /></FormControl><Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => openPicker(`${currentFieldName}.src`)}><ImageIcon className="h-4 w-4" /></Button></div><FormMessage /></FormItem>)} />
                                  <FormField control={control} name={`${currentFieldName}.alt`} render={({ field: iAltField }) => (<FormItem><FormLabel>Alt Text</FormLabel><FormControl><Input {...iAltField} /></FormControl><FormMessage /></FormItem>)} />
                                  <ImageUploader onUpload={(res) => form.setValue(`${currentFieldName}.src` as any, res.info.secure_url)} />
                                  </>
                              )}
                              {(field as any).type === 'button' && (
                                  <>
                                      <FormField control={control} name={`${currentFieldName}.text`} render={({ field: bField }) => (<FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...bField} /></FormControl><FormMessage /></FormItem>)} />
                                      <FormField control={control} name={`${currentFieldName}.href`} render={({ field: bHrefField }) => (<FormItem><FormLabel>Button Link (URL)</FormLabel><FormControl><Input {...bHrefField} /></FormControl><FormMessage /></FormItem>)} />
                                      <FormField control={control} name={`${currentFieldName}.variant`} render={({ field: bVarField }) => (<FormItem><FormLabel>Style</FormLabel><Select onValueChange={bVarField.onChange} defaultValue={bVarField.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="outline">Outline</SelectItem><SelectItem value="ghost">Ghost</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                  </>
                              )}
                              {(field as any).type === 'youtube' && (
                                  <FormField control={control} name={`${currentFieldName}.videoId`} render={({ field: yField }) => (
                                    <FormItem>
                                        <FormLabel>YouTube Video ID</FormLabel>
                                        <FormControl><Input {...yField} /></FormControl>
                                        <FormDescription>From a URL like youtube.com/watch?v=VIDEO_ID</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                  )} />
                              )}
                              {(field as any).type === 'coloredBox' && (
                                  <>
                                      <FormField control={control} name={`${currentFieldName}.text`} render={({ field: cbField }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...cbField} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                                      <FormField control={control} name={`${currentFieldName}.color`} render={({ field: cbColorField }) => (<FormItem><FormLabel>Background Color</FormLabel><div className="flex items-center gap-2"><FormControl><Input {...cbColorField} placeholder="hsl(var(--card))" /></FormControl><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon"><Palette className="h-4 w-4" /><span className="sr-only">Open color picker</span></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Theme Colors</DropdownMenuLabel><DropdownMenuSeparator />{Object.entries(themeColorPalette).map(([name, color]) => (<DropdownMenuItem key={name} onSelect={() => form.setValue(`${currentFieldName}.color` as any, color)}><div className="h-4 w-4 rounded-full border mr-2" style={{ backgroundColor: color }}/>{name}</DropdownMenuItem>))}<DropdownMenuSeparator /><DropdownMenuLabel>Standard Palette</DropdownMenuLabel><div className="p-2 grid grid-cols-4 gap-2">{defaultColorPalette.map(({name, color}) => (<button type="button" key={name} title={name} className="h-8 w-8 rounded-md border focus:outline-none focus:ring-2 focus:ring-ring" style={{ backgroundColor: color }} onClick={() => form.setValue(`${currentFieldName}.color` as any, color)}/>))}</div></DropdownMenuContent></DropdownMenu></div><FormDescription>Enter a custom HSL/hex code, or select from the palette.</FormDescription><FormMessage /></FormItem>)} />
                                  </>
                              )}
                              {(field as any).type === 'product_showcase' && (
                                  <>
                                      <FormField
                                        control={control}
                                        name={`${currentFieldName}.main_product_id`}
                                        render={({ field: psField }) => (
                                          <FormItem>
                                            <FormLabel>Main Product</FormLabel>
                                            <Select onValueChange={(val) => {
                                                psField.onChange(val);
                                                const prod = allProducts.find(p => p.id === val);
                                                if (prod?.variants?.length) {
                                                    form.setValue(`${currentFieldName}.main_product_unit` as any, prod.variants[0].unit);
                                                } else {
                                                    form.setValue(`${currentFieldName}.main_product_unit` as any, '');
                                                }
                                            }} value={psField.value}>
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select a main product" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                {allProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                            <FormDescription>This product will be displayed with a default quantity of 1.</FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      {(() => {
                                          const mainId = form.watch(`${currentFieldName}.main_product_id` as any);
                                          const selectedProd = allProducts.find(p => p.id === mainId);
                                          if (!selectedProd || !selectedProd.variants?.length) return null;
                                          
                                          return (
                                              <FormField
                                                  control={control}
                                                  name={`${currentFieldName}.main_product_unit` as any}
                                                  render={({ field: unitField }) => (
                                                      <FormItem>
                                                          <FormLabel>Default Unit/Variant</FormLabel>
                                                          <Select onValueChange={unitField.onChange} value={unitField.value}>
                                                              <FormControl>
                                                                  <SelectTrigger>
                                                                      <SelectValue placeholder="Select unit" />
                                                                  </SelectTrigger>
                                                              </FormControl>
                                                              <SelectContent>
                                                                  {selectedProd.variants?.map(v => (
                                                                      <SelectItem key={v.unit} value={v.unit}>
                                                                          {v.unit} - {v.price} BDT
                                                                      </SelectItem>
                                                                  ))}
                                                              </SelectContent>
                                                          </Select>
                                                          <FormMessage />
                                                      </FormItem>
                                                  )}
                                              />
                                          )
                                      })()}

                                      <FormField
                                        control={control}
                                        name={`${currentFieldName}.also_buy_title`}
                                        render={({ field: psTitleField }) => (
                                          <FormItem>
                                            <FormLabel>"Also Buy" Section Title (Optional)</FormLabel>
                                            <FormControl><Input {...psTitleField} placeholder="Also Buy" /></FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <ProductSelector
                                        control={control}
                                        namePrefix={currentFieldName}
                                        allProducts={allProducts}
                                        productIdsFieldName="optional_product_ids"
                                        label="Optional Products"
                                      />
                                  </>
                              )}
                              {(field as any).type === 'countdown' && (
                                  <>
                                      <FormField control={control} name={`${currentFieldName}.title`} render={({ field: cdTitleField }) => (<FormItem><FormLabel>Title (Optional)</FormLabel><FormControl><Input {...cdTitleField} /></FormControl><FormMessage /></FormItem>)} />
                                      <FormField
                                          control={control}
                                          name={`${currentFieldName}.endDate`}
                                          render={({ field: cdDateField }) => (
                                              <FormItem className="flex flex-col">
                                                  <FormLabel>End Date</FormLabel>
                                                  <Popover>
                                                      <PopoverTrigger asChild>
                                                          <FormControl>
                                                              <Button
                                                                  variant={"outline"}
                                                                  className={cn("w-[240px] pl-3 text-left font-normal", !cdDateField.value && "text-muted-foreground")}
                                                              >
                                                                  {cdDateField.value ? format(cdDateField.value, "PPP") : <span>Pick a date</span>}
                                                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                              </Button>
                                                          </FormControl>
                                                      </PopoverTrigger>
                                                      <PopoverContent className="w-auto p-0" align="start">
                                                          <Calendar mode="single" selected={cdDateField.value} onValueChange={cdDateField.onChange} initialFocus />
                                                      </PopoverContent>
                                                  </Popover>
                                                  <FormMessage />
                                              </FormItem>
                                          )}
                                      />
                                  </>
                              )}
                              {(field as any).type === 'carousel' && (
                                  <CarouselBlockEditor namePrefix={currentFieldName} control={control} />
                              )}
                              {(field as any).type === 'review' && (
                                <ReviewsCarouselEditor namePrefix={currentFieldName} control={control} />
                            )}
                          </div>
                      </Card>
                  )
              })}
               {editorFields.length === 0 && <p className="text-center text-muted-foreground py-8">Add your first content block.</p>}
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button type="button" variant="secondary" className="w-full">
                          <Plus className="mr-2 h-4 w-4" /> Add Block
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                      <DropdownMenuItem onSelect={() => addBlock('heading')}><Heading2 className="mr-2" /> Heading</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('paragraph')}><Type className="mr-2" /> Paragraph</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('image')}><ImageIcon className="mr-2" /> Image</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('button')}><LinkIcon className="mr-2" /> Button</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('youtube')}><Youtube className="mr-2" /> YouTube Video</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('coloredBox')}><Palette className="mr-2" /> Colored Box</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('product_showcase')}><ShoppingBag className="mr-2" /> Product Showcase</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('countdown')}><Clock className="mr-2" /> Countdown</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('carousel')}><GalleryHorizontal className="mr-2" /> Carousel</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addBlock('review')}><Star className="mr-2" /> Reviews Carousel</DropdownMenuItem>
                      <DropdownMenuSub>
                          <DropdownMenuSubTrigger><Columns className="mr-2" /> Layout</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                              <DropdownMenuItem onSelect={() => addBlock('layout', 1)}>1 Column</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => addBlock('layout', 2)}>2 Columns</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => addBlock('layout', 3)}>3 Columns</DropdownMenuItem>
                          </DropdownMenuSubContent>
                      </DropdownMenuSub>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
      );
  };

  const titleValue = form.watch('title');

  useEffect(() => {
    if (isNew && titleValue) {
      const slug = generateSlug(titleValue);
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [titleValue, isNew, form]);

  const fetchPageAndProducts = useCallback(async () => {
    if (!user) return;

    if (!isNew) {
        try {
            const response = await fetch('/api/pages/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pageId, siteId: user.id }),
            });
            const result = await response.json();
            
            if (response.ok && result.page) {
                const pageData = result.page as Page;
                const contentWithDates = (pageData.content || []).map((block: any) => {
                    if (block.type === 'countdown' && block.endDate && typeof block.endDate === 'string') {
                        return { ...block, endDate: new Date(block.endDate) };
                    }
                    return { ...block, id: block.id || uuidv4() };
                });

                form.reset({
                    title: pageData.title,
                    slug: pageData.slug,
                    content: contentWithDates,
                    is_published: pageData.is_published,
                });
            } else {
                throw new Error(result.error || 'Page not found');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push(`/admin/pages`);
            return;
        }
    }

    try {
        const [pRes, imgRes] = await Promise.all([
            fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) }),
            fetch('/api/images/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id }) })
        ]);
        const pResult = await pRes.json();
        const imgResult = await imgRes.json();

        if (pRes.ok) setAllProducts(pResult.products || []);
        if (imgRes.ok) setImages(imgResult.images || []);
    } catch (err: any) {
        console.error("Error fetching data:", err);
    }
    
    setIsLoading(false);

  }, [pageId, isNew, user, router, toast, form, setImages]);

  useEffect(() => {
    if (!authLoading) {
      fetchPageAndProducts();
    }
  }, [authLoading, fetchPageAndProducts]);

  // Image Picker filtered logic
  const filteredGallery = useMemo(() => {
    return galleryImages.filter(img => 
        (img.name || '').toLowerCase().includes(pickerSearch.toLowerCase())
    );
  }, [galleryImages, pickerSearch]);

  const paginatedGallery = useMemo(() => {
    const start = (pickerPage - 1) * IMAGES_PER_PAGE;
    return filteredGallery.slice(start, start + IMAGES_PER_PAGE);
  }, [filteredGallery, pickerPage]);

  const totalPickerPages = Math.ceil(filteredGallery.length / IMAGES_PER_PAGE);

  const handlePickerImageSelect = (url: string) => {
    if (pickerPath) {
        form.setValue(pickerPath as any, url, { shouldValidate: true, shouldDirty: true });
        setIsPickerOpen(false);
        setPickerPath(null);
    }
  };

  const handlePickerUploadSuccess = async (uploadRes: any) => {
    if (!user) return;
    try {
        const response = await fetch('/api/images/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user.id,
                url: uploadRes.info.secure_url,
                name: uploadRes.info.original_filename
            }),
        });
        if (response.ok) {
            const result = await response.json();
            const newImg = result.image;
            setImages([newImg, ...galleryImages]);
            if (pickerPath) {
                form.setValue(pickerPath as any, newImg.url, { shouldValidate: true, shouldDirty: true });
                setIsPickerOpen(false);
                setPickerPath(null);
            }
            toast({ title: 'Image uploaded and selected!' });
        }
    } catch (e) {
        console.error("Picker upload save error:", e);
    }
  };

  const onSubmit = async (values: PageFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication error' });
      return;
    }
    setIsSubmitting(true);
    
    try {
        const payload = { ...values, site_id: user.id, id: isNew ? undefined : pageId };
        const response = await fetch('/api/pages/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (response.ok) {
            toast({ title: `Page ${isNew ? 'created' : 'updated'} successfully!` });
            startTransition(() => {
                router.push(`/admin/pages`);
                router.refresh();
            });
        } else {
            if (response.status === 409) {
                form.setError('slug', { type: 'manual', message: result.error });
            } else {
                throw new Error(result.error || `Failed to ${isNew ? 'create' : 'update'} page`);
            }
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-32" /></CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4"><Link href={`/admin/pages`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages</Link></Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8">
            <Card>
              <CardHeader><CardTitle>{isNew ? 'Create New Page' : 'Edit Page'}</CardTitle><CardDescription>Fill in the details for your custom page.</CardDescription></CardHeader>
              <CardContent className="grid gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., About Our Farm" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>URL Slug</FormLabel><FormControl><div className="relative"><Input {...field} placeholder="e.g., about-our-farm" className="pl-20" /><span className="absolute left-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-muted h-8 px-2 flex items-center rounded-l-md border border-r-0 border-input">/pages/</span></div></FormControl><FormDescription>The unique URL path for this page.</FormDescription><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Add, edit, and reorder content blocks to build your page.</CardDescription></CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4">
                    <BlockEditor control={form.control} namePrefix="content" allProducts={allProducts} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="is_published" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Publish Page</FormLabel><FormDescription>Make this page accessible to the public.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isPending}>{(isSubmitting || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isNew ? 'Create Page' : 'Save Changes'}</Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Image Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsPickerOpen(false)} />
            <div className="relative w-full max-w-4xl bg-background rounded-[2.5rem] shadow-2xl border-2 border-primary/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ImageIcon className="h-6 w-6 text-primary" /> ছবি নির্বাচন করুন
                        </h2>
                        <p className="text-xs text-muted-foreground">গ্যালারি থেকে সিলেক্ট করুন অথবা নতুন ছবি আপলোড করুন।</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsPickerOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 flex flex-col gap-6 flex-grow overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="relative flex-grow w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="ছবির নাম দিয়ে খুঁজুন..." 
                                className="pl-10 h-11 rounded-xl"
                                value={pickerSearch}
                                onChange={(e) => { setPickerSearch(e.target.value); setPickerPage(1); }}
                            />
                        </div>
                        <ImageUploader onUpload={handlePickerUploadSuccess} label="নতুন আপলোড" />
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2">
                        {paginatedGallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {paginatedGallery.map((img) => {
                                    const isSelected = pickerPath && form.watch(pickerPath as any) === img.url;
                                    return (
                                        <div 
                                            key={img.id} 
                                            onClick={() => handlePickerImageSelect(img.url)}
                                            className={cn(
                                                "relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group",
                                                isSelected ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/40"
                                            )}
                                        >
                                            <Image src={img.url} alt={img.name || 'Gallery Image'} fill className="object-cover transition-transform group-hover:scale-110" />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                                                        <Check className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-[10px] text-white truncate text-center">{img.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                <ImageIcon className="h-12 w-12 opacity-20 mb-4" />
                                <p className="text-sm font-bold">কোনো ছবি পাওয়া যায়নি</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg" 
                            disabled={pickerPage === 1}
                            onClick={() => setPickerPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-bold px-3 py-1 bg-background rounded-md border">
                            পৃষ্ঠা {pickerPage} / {totalPickerPages || 1}
                        </span>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg" 
                            disabled={pickerPage >= totalPickerPages}
                            onClick={() => setPickerPage(p => p + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => setIsPickerOpen(false)}>বাতিল</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
