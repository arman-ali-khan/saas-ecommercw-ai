
-- support_tickets টেবিলের জন্য RLS সক্রিয় করা
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- SaaS Admin-এর জন্য পূর্ণ অ্যাক্সেস (সবকিছু করতে পারবেন)
CREATE POLICY "SaaS Admin full access on tickets"
ON support_tickets
FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
);

-- স্টোর অ্যাডমিনরা শুধুমাত্র তাদের নিজস্ব টিকেট দেখতে পারবেন
CREATE POLICY "Site admins can view own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (site_id = auth.uid());

-- স্টোর অ্যাডমিনরা শুধুমাত্র তাদের নিজস্ব টিকেট তৈরি করতে পারবেন
CREATE POLICY "Site admins can create tickets"
ON support_tickets
FOR INSERT
TO authenticated
WITH CHECK (site_id = auth.uid());


-- support_messages টেবিলের জন্য RLS সক্রিয় করা
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- SaaS Admin-এর জন্য পূর্ণ অ্যাক্সেস
CREATE POLICY "SaaS Admin full access on messages"
ON support_messages
FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'saas_admin'
);

-- স্টোর অ্যাডমিনরা শুধুমাত্র তাদের টিকেটের মেসেজ দেখতে পারবেন
CREATE POLICY "Users can view messages of own tickets"
ON support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = support_messages.ticket_id
    AND site_id = auth.uid()
  )
);

-- স্টোর অ্যাডমিনরা শুধুমাত্র তাদের টিকেটে মেসেজ পাঠাতে পারবেন
CREATE POLICY "Users can insert messages to own tickets"
ON support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = support_messages.ticket_id
    AND site_id = auth.uid()
  )
);
