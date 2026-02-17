import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };

export async function getTranslations(username: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );

    try {
        const { data: profile } = await supabase.from('profiles').select('id').eq('domain', username).single();
        if (!profile) {
            console.warn(`[getTranslations] Profile not found for domain: ${username}. Defaulting to 'bn'.`);
            return bn;
        }

        const { data: settings } = await supabase.from('store_settings').select('language').eq('site_id', profile.id).single();
        const lang = settings?.language || 'bn';

        return translations[lang as keyof typeof translations] || bn;
    } catch(e) {
        console.error(`[getTranslations] Error fetching translations for ${username}:`, e);
        return bn;
    }
}
