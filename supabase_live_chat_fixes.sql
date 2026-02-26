
-- live_chat_messages table security hardening
-- This script fixes the overly permissive RLS policies

-- 1. Remove insecure legacy policies
DROP POLICY IF EXISTS "Anyone can insert messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Public can insert messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Restricted insert for customers" ON live_chat_messages;

-- 2. Ensure RLS is enabled
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. SaaS Admin Policy: Full access to everything
CREATE POLICY "SaaS admins full access" ON live_chat_messages
    FOR ALL TO authenticated
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin');

-- 4. Site Admin Policy: Access only to their own store's messages
CREATE POLICY "Site admins own store access" ON live_chat_messages
    FOR ALL TO authenticated
    USING (site_id = auth.uid());

-- 5. Public/Customer Policy: Restrict INSERT to 'customer' type only
-- This prevents guests from spoofing agent/admin replies
CREATE POLICY "Public restricted insert" ON live_chat_messages
    FOR INSERT
    WITH CHECK (
        sender_type = 'customer' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = site_id)
    );

-- 6. Public Read Policy: Allow reading messages
-- (Client-side logic filters by conversation_id for privacy)
CREATE POLICY "Public select access" ON live_chat_messages
    FOR SELECT
    USING (true);
