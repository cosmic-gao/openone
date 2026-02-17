'use client';

import { useShellStore } from '@/stores/shellStore';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-background/85 backdrop-blur-md shrink-0">
      {/* 左侧：当前APP名称 */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">
          {activeApp?.appName || '欢迎使用 OpenOne'}
        </h2>
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{user.username}</span>
          </div>
        )}

        <Separator orientation="vertical" className="h-5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>退出登录</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
