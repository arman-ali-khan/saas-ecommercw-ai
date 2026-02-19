
-- 1. SaaS Settings Table (For Section Manager and Global Config)
CREATE TABLE IF NOT EXISTS saas_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    platform_name TEXT DEFAULT 'Bangla Naturals',
    platform_description TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    base_domain TEXT DEFAULT 'schoolbd.top',
    social_facebook TEXT,
    social_twitter TEXT,
    social_tiktok TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    mobile_banking_enabled BOOLEAN DEFAULT FALSE,
    mobile_banking_number TEXT,
    accepted_banking_methods TEXT[], -- e.g., ['bkash', 'nagad']
    homepage_sections JSONB DEFAULT '[
        {"id": "hero", "title": "Hero Section", "enabled": true},
        {"id": "features", "title": "Features Grid", "enabled": true},
        {"id": "showcase", "title": "Platform Showcase", "enabled": true},
        {"id": "stats", "title": "Platform Stats", "enabled": true},
        {"id": "pricing", "title": "Pricing Plans", "enabled": true},
        {"id": "testimonial", "title": "Testimonials", "enabled": true},
        {"id": "cta", "title": "Call to Action", "enabled": true}
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_id CHECK (id = 1) -- Only one row allowed
);

-- Ensure the initial settings row exists
INSERT INTO saas_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. SaaS Showcase Table (For Landing Page Carousel)
CREATE TABLE IF NOT EXISTS saas_showcase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies

-- SaaS Settings Policies
ALTER TABLE saas_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for saas_settings" 
ON saas_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow SaaS admins to update saas_settings" 
ON saas_settings FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'saas_admin'
    )
);

-- SaaS Showcase Policies
ALTER TABLE saas_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for saas_showcase" 
ON saas_showcase FOR SELECT 
USING (true);

CREATE POLICY "Allow SaaS admins to manage saas_showcase" 
ON saas_showcase FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'saas_admin'
    )
);

-- 4. Helper Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saas_settings_modtime
    BEFORE UPDATE ON saas_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
