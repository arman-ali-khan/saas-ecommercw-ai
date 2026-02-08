import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'বাংলা ন্যাচারালস',
  description: 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Orbitron:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
