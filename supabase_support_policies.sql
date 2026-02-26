
-- Enable RLS for support tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "SaaS admins can do everything on tickets" ON support_tickets;
DROP POLICY IF EXISTS "Site admins can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Site admins can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "SaaS admins can do everything on messages" ON support_messages;
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON support_messages;
DROP POLICY IF EXISTS "Users can insert messages to own tickets" ON support_messages;

-- Support Tickets Policies
CREATE POLICY "SaaS admins full access on tickets" ON support_tickets
    FOR ALL TO authenticated USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
    );

CREATE POLICY "Site admins view own tickets" ON support_tickets
    FOR SELECT TO authenticated USING (site_id = auth.uid());

CREATE POLICY "Site admins create own tickets" ON support_tickets
    FOR INSERT TO authenticated WITH CHECK (site_id = auth.uid());

-- Support Messages Policies
CREATE POLICY "SaaS admins full access on messages" ON support_messages
    FOR ALL TO authenticated USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
    );

CREATE POLICY "Users view messages of own tickets" ON support_messages
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND site_id = auth.uid())
    );

CREATE POLICY "Users insert messages to own tickets" ON support_messages
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND site_id = auth.uid())
    );
