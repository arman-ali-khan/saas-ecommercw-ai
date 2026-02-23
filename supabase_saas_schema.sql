-- ১. প্ল্যাটফর্ম শোকেস টেবিল তৈরি (Landing Page Showcase)
CREATE TABLE IF NOT EXISTS public.saas_showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ২. সাাস সেটিংস টেবিলে 'homepage_sections' কলাম নিশ্চিত করা
-- যদি টেবিল না থাকে তবে তৈরি করুন, নতুবা কলাম যোগ করুন
CREATE TABLE IF NOT EXISTS public.saas_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    platform_name TEXT DEFAULT 'eHut',
    platform_description TEXT,
    homepage_sections JSONB, -- এটি ল্যান্ডিং পেজের সেকশন অর্ডার ও স্ট্যাটাস জমা রাখবে
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ৩. ডিফল্ট সেকশন কনফিগারেশন ইনসার্ট বা আপডেট করা (ID 1 এর জন্য)
INSERT INTO public.saas_settings (id, platform_name, homepage_sections)
VALUES (1, 'eHut', '[
  {"id": "hero", "title": "Hero Section", "enabled": true},
  {"id": "features", "title": "Features Grid", "enabled": true},
  {"id": "showcase", "title": "Platform Showcase", "enabled": true},
  {"id": "stats", "title": "Platform Stats", "enabled": true},
  {"id": "pricing", "title": "Pricing Plans", "enabled": true},
  {"id": "testimonial", "title": "Testimonials", "enabled": true},
  {"id": "cta", "title": "Call to Action", "enabled": true}
]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET homepage_sections = EXCLUDED.homepage_sections 
WHERE public.saas_settings.homepage_sections IS NULL;

-- ৪. RLS (Row Level Security) পলিসি (নিরাপত্তার জন্য)
ALTER TABLE public.saas_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;

-- সকলের জন্য পড়ার অনুমতি (Public Read Access)
CREATE POLICY "Allow public read access for showcase" ON public.saas_showcase FOR SELECT USING (true);
CREATE POLICY "Allow public read access for saas_settings" ON public.saas_settings FOR SELECT USING (true);

-- শুধুমাত্র সার্ভিস রোল বা অ্যাডমিনদের জন্য এডিট করার অনুমতি (Service Role handles this via API)
-- ড্যাশবোর্ড থেকে পরিবর্তনের জন্য সুপাবেস সার্ভিস কি ব্যবহার করা হবে।