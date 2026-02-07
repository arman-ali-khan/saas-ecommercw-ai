'use client';

import { useState } from 'react';
import { getProducts } from '@/lib/products';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function FeaturedProductsPage() {
  const allProducts = getProducts();
  // In a real app, you'd fetch the current featured products state.
  // For now, we'll simulate it with local state, initially featuring the first product.
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([
    allProducts[0]?.id,
  ]);
  const { toast } = useToast();

  const handleCheckboxChange = (productId: string, checked: boolean) => {
    setFeaturedProductIds((prev) => {
      if (checked) {
        return [...prev, productId];
      } else {
        return prev.filter((id) => id !== productId);
      }
    });
  };

  const handleSaveChanges = () => {
    // Here you would typically save the `featuredProductIds` to your database.
    console.log('Saving featured products:', featuredProductIds);
    toast({
      title: 'Success!',
      description: 'Featured products have been updated.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Products Manager</CardTitle>
        <CardDescription>
          Select which products to display on the homepage featured section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allProducts.map((product) => (
          <div key={product.id} className="flex items-center space-x-2">
            <Checkbox
              id={product.id}
              checked={featuredProductIds.includes(product.id)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(product.id, !!checked)
              }
            />
            <Label htmlFor={product.id} className="text-base">
              {product.name}
            </Label>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
