import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenOne - APP管理',
  description: 'APP发布与管理',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
