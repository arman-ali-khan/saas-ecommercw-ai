import Link from 'next/link';
import { Facebook, Twitter } from 'lucide-react';
import Logo from './logo';

const TikTokIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z" />
      <path d="M9 8.5h4" />
      <path d="M9 12.5h4" />
      <path d="M13.5 4.5v4" />
    </svg>
  );

export default function SaasFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <p className="max-w-xs text-secondary-foreground/80">
              আপনার নিজস্ব ই-কমার্স সাম্রাজ্য তৈরি করার প্ল্যাটফর্ম।
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-headline font-semibold mb-4">প্ল্যাটফর্ম</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    বৈশিষ্ট্য
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    মূল্য
                  </Link>
                </li>
                 <li>
                  <Link
                    href="/register"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    বিনামূল্যে শুরু করুন
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-headline font-semibold mb-4">কোম্পানি</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    আমাদের সম্পর্কে
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    যোগাযোগ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">আমাদের অনুসরণ করুন</h3>
            <div className="flex space-x-4">
              <Link
                href="#"
                aria-label="Facebook"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <Facebook />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <Twitter />
              </Link>
              <Link
                href="#"
                aria-label="TikTok"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <TikTokIcon />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} বাংলা ন্যাচারালস। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
}
