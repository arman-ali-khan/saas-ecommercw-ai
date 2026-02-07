import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FixedCartButton />
      <FloatingChatButton />
    </>
  );
}
