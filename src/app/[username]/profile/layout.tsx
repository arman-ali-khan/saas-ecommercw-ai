import ProfileSidebar from '@/components/profile-sidebar';

export default function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar username={params.username} />
      <main>{children}</main>
    </div>
  );
}
