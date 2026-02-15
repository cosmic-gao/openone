import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenOne - 登录',
  description: 'OpenOne多APP管理平台登录',
};

/**
 * 登录APP根布局
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
