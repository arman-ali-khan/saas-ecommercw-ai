
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
 * Fetches a stable animation from a public CDN.
 */
export default function EcommerceAnimation({ className, speed = 1 }: EcommerceAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetching a stable high-quality E-commerce shopping animation
    // Updated to a more reliable URL and added soft error handling
    fetch('https://lottie.host/67ca78a4-09c3-4fa7-9cc1-ec790bc2746d/S8X9ZpIs9O.json')
      .then((res) => {
        if (!res.ok) {
            console.warn("Lottie animation could not be fetched, showing placeholder.");
            return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAnimationData(data);
      })
      .catch((err) => {
        // Soft logging instead of throwing to prevent Next.js error overlay
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
