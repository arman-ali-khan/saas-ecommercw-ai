
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase/client';

export const checkDomainExists = async (domain: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('domain', domain)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error checking domain existence:", error);
        return false; // Failsafe, treat as not existing on error
    }

    return !!data;
};


export const getProductsByDomain = async (domain: string): Promise<Product[]> => {
    // 1. Find site_id from domain
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('domain', domain)
        .single();
    
    if (!profile) {
        return [];
    }

    // 2. Fetch products for that site_id
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', profile.id);

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }
    
    return products as Product[];
};

export const getProductsBySiteId = async (siteId: string): Promise<Product[]> => {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', siteId);

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }
    
    return products as Product[];
}

export const getProductById = async (id: string, domain: string): Promise<Product | null> => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('domain', domain)
        .single();
        
    if (!profile) {
        console.error(`Error fetching profile for domain: ${domain}`);
        return null;
    }

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('site_id', profile.id)
        .single();
    
    if (error) {
        // It's okay if no row is found, but log other errors.
        if (error.code !== 'PGRST116') {
             console.error("Error fetching product:", error);
        }
        return null;
    }
    
    return product as Product;
};

/**
 * @deprecated This function is deprecated. Use getProductsBySiteId or getProductsByDomain instead.
 * It is kept to prevent build errors from legacy components and returns an empty array.
 */
export const getProducts = (): Product[] => {
    console.warn("`getProducts` is a deprecated function and will be removed in a future version.");
    return [];
};
