import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'The Longhorn Ledger',
  description: 'A simple app for tracking golf strokes gained.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
      <Toaster />
    </ClerkProvider>
  ) : (
    <>
      {children}
      <Toaster />
    </>
  );

  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          'h-full min-h-screen font-body antialiased',
          'bg-background'
        )}
      >
        {content}
      </body>
    </html>
  );
}
