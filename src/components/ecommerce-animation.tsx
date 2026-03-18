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
 * Fetches a stable high-quality animation from a reliable public source.
 */
export default function EcommerceAnimation({ className, speed = 1 }: EcommerceAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetching a stable high-quality shopping/ecommerce animation
    fetch('https://assets10.lottiefiles.com/packages/lf20_m9ubp9cv.json')
      .then((res) => {
        if (!res.ok) {
            // Fallback to another stable URL if the first one fails
            return fetch('https://lottie.host/67ca78a4-09c3-4fa7-9cc1-ec790bc2746d/S8X9ZpIs9O.json').then(r => r.json());
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAnimationData(data);
      })
      .catch((err) => {
        console.error("Lottie Animation Load Error:", err);
      });
  }, []);

  if (!animationData) {
    // Return a styled placeholder while loading or on failure
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
    <div className={cn("overflow-hidden flex items-center justify-center", className)}>
      <Lottie 
        animationData={animationData} 
        loop={true} 
        initialSegment={undefined}
        speed={speed}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
