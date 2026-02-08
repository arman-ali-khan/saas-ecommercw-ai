'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { Button } from './ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUpload: (result: any) => void;
  label?: string;
  multiple?: boolean;
}

const ImageUploader = ({ onUpload, label = 'Upload Image', multiple = false }: ImageUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return (
      <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
        <p className="font-bold">Cloudinary Not Configured</p>
        <p className="text-sm">
          Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.
        </p>
      </div>
    );
  }

  const handleUploadBegin = () => {
    setIsUploading(true);
  };
  
  const handleUploadSuccess = (result: any) => {
    onUpload(result);
    setIsUploading(false);
    toast({
        title: "Image uploaded successfully!",
    });
  };

  const handleError = (error: any) => {
    setIsUploading(false);
    toast({
      variant: 'destructive',
      title: 'Upload failed',
      description: error.message || 'An unknown error occurred during upload.',
    });
  }

  return (
    <CldUploadWidget
      uploadPreset={uploadPreset}
      options={{
        sources: ['local', 'url', 'camera'],
        multiple: multiple,
        folder: 'bangla_naturals',
      }}
      onSuccess={handleUploadSuccess}
      onUploadBegin={handleUploadBegin}
      onError={handleError}
    >
      {({ open }) => {
        return (
          <Button type="button" variant="outline" onClick={() => open()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : label}
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};

export default ImageUploader;
