import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeOps — Know if a job is worth your time',
  description: 'AI-powered job evaluation and tailored resume generation. Proven on 740+ real job evaluations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
