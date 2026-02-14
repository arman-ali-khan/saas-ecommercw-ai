'use client';

import { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { supabase } from '@/lib/supabase/client';

const CustomTopLoader = () => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hostname = window.location.hostname;
        const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
        const domain = hostname.split('.')[0];
        const isStorePage = hostname !== rootDomain && hostname !== `www.${rootDomain}`;

        async function fetchLogo() {
            if (isStorePage && domain) {
                const { data: profileData } = await supabase.from('profiles').select('id').eq('domain', domain).single();
                if (profileData) {
                    const { data: settingsData } = await supabase
                        .from('store_settings')
                        .select('logo_type, logo_image_url')
                        .eq('site_id', profileData.id)
                        .single();

                    if (settingsData?.logo_type === 'image' && settingsData.logo_image_url) {
                        setLogoUrl(settingsData.logo_image_url);
                    }
                }
            }
            setIsLoading(false);
        }

        fetchLogo();
    }, []); // Run only once on mount

    if (isLoading) {
        return <NextTopLoader color="hsl(var(--primary))" showSpinner={true} />;
    }

    if (logoUrl) {
        const template = `
            <div class="bar" role="bar">
                <div class="peg"></div>
            </div>
            <div class="spinner" role="spinner">
                <div class="spinner-icon with-logo" style="background-image: url(${logoUrl});"></div>
            </div>
        `;
        return <NextTopLoader color="hsl(var(--primary))" showSpinner={true} template={template} />;
    }
    
    // Fallback for SaaS pages or stores without image logos
    return <NextTopLoader color="hsl(var(--primary))" showSpinner={true} />;
};

export default CustomTopLoader;
