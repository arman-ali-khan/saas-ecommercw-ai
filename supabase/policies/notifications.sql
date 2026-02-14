-- IMPORTANT: Applying these policies will likely break notifications for customers
-- until the customer authentication system is updated to use Supabase's
-- built-in auth to create a secure session.

-- 1. Enable Row Level Security on the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own notifications.
-- This works for any user authenticated via Supabase Auth (e.g., admins).
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- 3. Allow users to update their own notifications (e.g., mark as read).
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- 4. Allow a user to insert a notification for themselves.
-- This is for security completeness, as our app creates notifications on the server.
CREATE POLICY "Users can create notifications for themselves"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (recipient_id = auth.uid());

-- By default, the 'service_role' (used by our API routes) bypasses RLS,
-- so it will still be able to create notifications for any user.
-- No specific policy for service_role is needed unless security invoker is used.
