
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Dynamically import Lottie to prevent SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface EcommerceAnimationProps {
  className?: string;
  speed?: number;
}

/**
 * @fileOverview A reusable Lottie animation component for E-commerce visuals.
 * Fetches a high-quality animation from a public CDN.
 */
export default function EcommerceAnimation({ className, speed = 1 }: EcommerceAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetching a confirmed high-quality E-commerce shopping bag animation
    fetch('https://assets2.lottiefiles.com/packages/lf20_m9ubp9cv.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load animation');
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Lottie Animation Load Error:", err));
  }, []);

  if (!animationData) {
    // Return a styled placeholder while loading
    return (
      <div 
        className={cn(
          "animate-pulse bg-primary/10 rounded-2xl flex items-center justify-center", 
          className
        )}
      >
        <div className="w-1/2 h-1/2 bg-primary/20 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <Lottie 
        animationData={animationData} 
        loop={true} 
        initialSegment={undefined}
        speed={speed}
      />
    </div>
  );
}
