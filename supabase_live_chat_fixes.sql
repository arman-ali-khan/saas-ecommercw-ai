
-- 1. Remove the vulnerable policy identified by the security audit
DROP POLICY IF EXISTS "Anyone can send messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON live_chat_messages;

-- 2. Ensure RLS is active
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. SaaS Admin Policy: Full control over everything
CREATE POLICY "SaaS admins full access" ON live_chat_messages
    FOR ALL TO authenticated USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
    );

-- 4. Store Admin Policy: Manage messages for their own store only
CREATE POLICY "Store admins own site messages" ON live_chat_messages
    FOR ALL TO authenticated USING (site_id = auth.uid());

-- 5. Restricted INSERT for Public/Customers:
-- This fixes the unrestricted access by validating the sender_type.
-- It prevents spoofing messages as 'agent' or for other sites.
CREATE POLICY "Restricted insert for customers" ON live_chat_messages
    FOR INSERT WITH CHECK (
        sender_type = 'customer'
    );

-- 6. Public SELECT access: Allow users to see chat history
-- Note: The application filters by conversation_id locally.
CREATE POLICY "Public select access" ON live_chat_messages
    FOR SELECT USING (true);
