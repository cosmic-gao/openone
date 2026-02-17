'use client';

import { useEffect } from 'react';
import { useShellStore } from '@/stores/shellStore';
import { verifyToken } from '@openone/utils';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret-change-me';

/**
 * 认证回调页面
 * 接收auth-app传来的Token，存储后跳转到首页
 */
export default function AuthCallbackPage() {
  const { setAuth } = useShellStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      const payload = verifyToken(accessToken, JWT_SECRET);
      if (payload) {
        setAuth(
          {
            id: payload.sub,
            username: payload.username,
            roles: payload.roles,
            permissions: payload.permissions,
            email: '',
          },
          accessToken,
          refreshToken
        );
        window.location.href = '/';
        return;
      }
    }

    // Token无效，返回登录
    window.location.href = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
  }, [setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        正在登录...
      </div>
    </div>
  );
}
