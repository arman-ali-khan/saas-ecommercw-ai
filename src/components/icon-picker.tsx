'use client';

import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import DynamicIcon from './dynamic-icon';
import { ScrollArea } from './ui/scroll-area';

export const iconList = [
  // Home & General
  'Home', 'Store', 'Building2', 'Warehouse', 'Map', 'Globe',
  // Shopping & Ecommerce
  'Package', 'ShoppingCart', 'ShoppingBag', 'ShoppingBasket', 'Tag', 'Tags', 'Ticket', 'Percent', 'Truck', 'Box', 'CreditCard', 'Wallet', 'Banknote',
  // Layout & Categories
  'LayoutGrid', 'List', 'Columns', 'Grid3X3', 'Rows', 'Layers',
  // Social & Communication
  'Facebook', 'Twitter', 'Instagram', 'Linkedin', 'Youtube', 'Share2', 'MessageCircle', 'MessageSquare', 'Send', 'Mail', 'Phone',
  // Tools & Settings
  'Settings', 'Cog', 'Wrench', 'Hammer', 'Shield', 'ShieldCheck', 'Lock', 'Key', 'Search', 'Info', 'Bell', 'HelpCircle', 'Clock',
  // Nature & Food
  'Leaf', 'Sprout', 'TreePine', 'Flower', 'Sun', 'Moon', 'Cloud', 'Apple', 'Carrot', 'Grape', 'Coffee', 'Beef', 'Fish', 'Milk', 'GlassWater', 'Pizza', 'Cake', 'Cookie',
  // Indicators & Misc
  'Star', 'Heart', 'Smile', 'ThumbsUp', 'Flame', 'Zap', 'Sparkles', 'Gift', 'Award', 'Badge', 'Crown', 'Trophy', 'Rocket', 'MapPin', 'CheckCircle2'
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <ScrollArea className="h-72 w-full rounded-xl border p-4 bg-muted/10">
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
        {iconList.map((iconName) => (
            <Button
            key={iconName}
            variant="outline"
            size="icon"
            type="button"
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                onChange(iconName); 
            }}
            className={cn(
                'flex items-center justify-center h-10 w-10 transition-all',
                value === iconName ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'hover:border-primary/50'
            )}
            title={iconName}
            >
            <DynamicIcon name={iconName} className={cn("h-5 w-5", value === iconName ? "text-primary" : "text-muted-foreground")} />
            <span className="sr-only">{iconName}</span>
            </Button>
        ))}
        </div>
    </ScrollArea>
  );
}
