import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenOne - 权限管理',
  description: '统一权限管理中心',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
