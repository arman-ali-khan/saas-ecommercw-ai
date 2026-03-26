'use client';

import NextImage, { ImageProps } from 'next/image';
import cloudinaryLoader from '@/lib/cloudinary-loader';

export function OptimizedImage(props: ImageProps) {
  return <NextImage loader={cloudinaryLoader} {...props} />;
}
