Get-ChildItem -Path src -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $updated = $false
    
    # 1. Replace regular Image import
    if ($content -match "import Image from ['\"']next/image['\"']") {
        $content = $content -replace "import Image from ['\"']next/image['\"']", "import { OptimizedImage as Image } from '@/components/ui/optimized-image'"
        $updated = $true
    }
    
    # 2. Replace NextImage import (from my previous manual updates)
    if ($content -match "import NextImage from ['\"']next/image['\"']") {
        $content = $content -replace "import NextImage from ['\"']next/image['\"']", "import { OptimizedImage as Image } from '@/components/ui/optimized-image'"
        # Remove the manual wrapper definition if it exists
        $content = $content -replace "import cloudinaryLoader from '@/lib/cloudinary-loader';\s*const Image = \(props: any\) => <NextImage loader={cloudinaryLoader} {\.\.\.props} />;", ""
        # Handle slightly different versions of the wrapper
        $content = $content -replace "import cloudinaryLoader from '@/lib/cloudinary-loader';\s*\n\s*const Image = \(props: any\) => <NextImage loader={cloudinaryLoader} {\.\.\.props} />;", ""
        $updated = $true
    }

    if ($updated) {
        [System.IO.File]::WriteAllText($_.FullName, $content)
        Write-Host "Updated: $($_.FullName)"
    }
}
