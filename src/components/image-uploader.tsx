'use client';

import { Button } from './ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUpload: (result: any) => void;
  label?: string;
  multiple?: boolean;
}

const ImageUploader = ({ onUpload, label = 'Upload Image', multiple = false }: ImageUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return (
      <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
        <p className="font-bold">Cloudinary Not Configured</p>
        <p className="text-sm">
          Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.
        </p>
      </div>
    );
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error.message);
        }

        // The onUpload prop expects a specific structure from the old CldUploadWidget.
        // We simulate it here for compatibility.
        onUpload({ event: 'success', info: result });
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: `Upload failed for ${file.name}`,
          description: error.message || 'An unknown error occurred during upload.',
        });
        // Stop uploading on the first error
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }
    
    toast({
        title: "Upload complete!",
        description: `${files.length} image(s) uploaded successfully.`
    });

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={multiple}
        className="hidden"
        id="direct-cloudinary-upload"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Uploading...' : label}
      </Button>
    </>
  );
};

export default ImageUploader;
