/**
 * Cloudinary Custom Loader for Next.js Image Component.
 * Offloads image optimization from Vercel to Cloudinary.
 * Handles both direct Cloudinary uploads and external image fetching.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Don't process non-http sources
  if (!src.startsWith('http')) return src;

  // Optimization parameters: 
  // f_auto: choose best format (webp/avif)
  // c_limit: resize while preserving aspect ratio
  // w_xxx: set width
  // q_xxx: set quality
  const params = [
    'f_auto',
    'c_limit',
    `w_${width}`,
    `q_${quality || 'auto'}`,
  ].join(',');

  // 1. If the image is already hosted on Cloudinary
  if (src.includes('res.cloudinary.com')) {
    // Avoid double-injecting parameters if they already exist
    if (src.includes('/upload/f_auto') || src.includes('/upload/w_')) return src;
    return src.replace('/upload/', `/upload/${params}/`);
  }

  // 2. For external images (Unsplash, Picsum, etc.), use Cloudinary's "Fetch" API.
  // Note: Your Cloudinary account must have "Fetched URL" enabled in Security settings.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return src; // Fallback to original if cloud name is missing

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${params}/${encodeURIComponent(src)}`;
}
