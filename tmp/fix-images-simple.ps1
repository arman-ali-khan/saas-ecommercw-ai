# Get all .tsx files in src
$files = Get-ChildItem -Path src -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $changed = $false
        
        # Replace normal Image import
        if ($content.Contains("import Image from 'next/image'")) {
            $content = $content.Replace("import Image from 'next/image'", "import { OptimizedImage as Image } from '@/components/ui/optimized-image'")
            $changed = $true
        }
        if ($content.Contains("import Image from `"next/image`"")) {
            $content = $content.Replace("import Image from `"next/image`"", "import { OptimizedImage as Image } from '@/components/ui/optimized-image'")
            $changed = $true
        }
        
        # Replace NextImage import (my previous manual fixes)
        if ($content.Contains("import NextImage from 'next/image'")) {
            $content = $content.Replace("import NextImage from 'next/image'", "import { OptimizedImage as Image } from '@/components/ui/optimized-image'")
            # Remove the manual wrapper definition I added
            $content = $content -replace "import cloudinaryLoader from '@/lib/cloudinary-loader';[\s\n]*const Image = \(props: any\) => <NextImage loader={cloudinaryLoader} {\.\.\.props} />;", ""
            $changed = $true
        }

        if ($changed) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Updated: $($file.FullName)"
        }
    } catch {
        Write-Warning "Could not process $($file.FullName): $_"
    }
}
