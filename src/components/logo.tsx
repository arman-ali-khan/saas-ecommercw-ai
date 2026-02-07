import { cn } from '@/lib/utils';
import { Leaf } from 'lucide-react';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xl font-bold font-headline text-foreground',
        className
      )}
    >
      <div className="bg-primary p-2 rounded-full">
        <Leaf className="h-5 w-5 text-primary-foreground" />
      </div>
      <span>Bangla Naturals</span>
    </div>
  );
};

export default Logo;
