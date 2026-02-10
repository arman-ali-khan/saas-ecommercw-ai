'use client';

import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import DynamicIcon from './dynamic-icon';
import { ScrollArea } from './ui/scroll-area';

export const iconList = [
  'Leaf', 'Store', 'ShoppingBasket', 'Sparkles', 'Gift', 'Heart', 'Star', 'Sun', 'Moon', 'Apple', 
  'Carrot', 'Grape', 'Coffee', 'Flower', 'TreePine', 'Mountain', 'Wind', 'Gem', 'HandHeart', 'Book', 
  'Home', 'Package', 'ShoppingCart', 'Truck', 'Bike', 'Plane', 'Anchor', 'Award', 'Badge', 'Banknote', 
  'Bone', 'Cake', 'Candy', 'Cookie', 'Crown', 'Diamond', 'Feather', 'Fish', 'Flame', 'Gamepad2', 
  'Ghost', 'Hammer', 'IceCream2', 'KeyRound', 'Lightbulb', 'Map', 'Palette', 'Pizza', 'Puzzle', 'Rocket'
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <ScrollArea className="h-72 w-full rounded-md border p-4">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {iconList.map((iconName) => (
            <Button
            key={iconName}
            variant="outline"
            size="icon"
            onClick={(e) => { e.preventDefault(); onChange(iconName); }}
            className={cn(
                'flex items-center justify-center',
                value === iconName && 'ring-2 ring-primary'
            )}
            >
            <DynamicIcon name={iconName} className="h-5 w-5" />
            <span className="sr-only">{iconName}</span>
            </Button>
        ))}
        </div>
    </ScrollArea>
  );
}
