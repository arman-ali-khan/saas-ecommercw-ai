
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // List of fallback URLs for the same or similar animation
    const urls = [
      'https://assets10.lottiefiles.com/packages/lf20_m9ubp9cv.json',
      'https://lottie.host/67ca78a4-09c3-4fa7-9cc1-ec790bc2746d/S8X9ZpIs9O.json'
    ];

    const loadLottie = async () => {
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (!response.ok) continue;

          const text = await response.text();
          
          // Basic check to see if it looks like XML/HTML instead of JSON
          if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
            console.warn(`Lottie source ${url} returned XML/HTML instead of JSON.`);
            continue;
          }

          try {
            const data = JSON.parse(text);
            if (data && typeof data === 'object') {
              setAnimationData(data);
              return; // Success!
            }
          } catch (parseErr) {
            console.error(`JSON parse error for ${url}:`, parseErr);
          }
        } catch (err) {
          console.error(`Failed to load Lottie from ${url}:`, err);
        }
      }
      setHasError(true);
    };

    loadLottie();
  }, []);

  if (hasError || !animationData) {
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
