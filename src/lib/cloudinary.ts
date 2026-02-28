import { v2 as cloudinary } from 'cloudinary';

/**
 * @fileOverview Cloudinary Server SDK configuration.
 * Used for server-side media handling, transformations, and deletion.
 */

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
