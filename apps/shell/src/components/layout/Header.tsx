'use client';

import { useShellStore } from '@/stores/shellStore';
import { LogOut, User } from 'lucide-react';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';

/**
 * 顶栏组件
 * 展示当前APP名称、用户信息和登出按钮
 */
export function Header() {
  const { user, activeAppId, registeredApps, clearAuth } = useShellStore();

  const activeApp = registeredApps.find((app) => app.appId === activeAppId);

  /**
   * 处理登出
   */
  function handleLogout() {
    clearAuth();
    window.location.href = AUTH_URL;
  }

  return (
    <header
      className="flex items-center justify-between px-6 border-b shrink-0 backdrop-blur-md"
      style={{
        height: 'var(--header-height)',
        background: 'var(--color-header)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* 左侧：当前APP名称 */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">
          {activeApp?.appName || '欢迎使用 OpenOne'}
        </h2>
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-surface-hover)' }}
            >
              <User size={14} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {user.username}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-dim)' }}
          title="退出登录"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
