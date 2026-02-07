import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';

export default function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  return (
    <>
      {children}
      <FixedCartButton username={params.username} />
      <FloatingChatButton />
    </>
  );
}
