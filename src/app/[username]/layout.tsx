import Header from '@/components/header';
import Footer from '@/components/footer';
import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </div>
      <FixedCartButton />
      <FloatingChatButton />
    </>
  );
}
