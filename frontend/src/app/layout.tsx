import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Shell from './actuallayout';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Your Forum',
  description: 'Forum with Supabase + Next.js 15',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white font-serif`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

