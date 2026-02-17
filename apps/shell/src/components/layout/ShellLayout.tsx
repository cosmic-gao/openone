'use client';

import { useEffect } from 'react';
import { useShellStore } from '@/stores/shellStore';
import { verifyToken } from '@openone/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AppContainer } from './AppContainer';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret-change-me';
const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002';

/**
 * Shell主布局组件
 * 负责认证检查、子APP注册和整体布局渲染
 */
export function ShellLayout() {
  const { isAuthenticated, setAuth, setRegisteredApps } = useShellStore();

  useEffect(() => {
    // 1. 优先处理 URL 参数中的 Token（登录回调）
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
        // 清除URL参数，保持地址栏干净
        window.history.replaceState({}, '', '/');
        return; // 登录成功，结束本次 check
      }
    }

    // 2. 检查当前 Store 中的 Token 是否有效
    const currentToken = useShellStore.getState().accessToken;
    if (currentToken) {
        const payload = verifyToken(currentToken, JWT_SECRET);
        if (!payload) {
            // Token 无效或过期，清除状态并重定向
            useShellStore.getState().clearAuth();
            window.location.replace(AUTH_URL);
            return;
        }
        // Token 有效，不做操作
        if (!useShellStore.getState().isAuthenticated) {
             // 边界情况：有 Token 但 isAuthenticated 为 false，恢复状态（通常 setAuth 会同时设置 true）
             // 这里逻辑上应该不需要，因为 verifyToken 成功意味着我们可以从 Token 恢复用户信息
             // 但由于 setAuth 需要用户信息，这里如果只存了 Token 可能不够，
             // 实际上 useShellStore 应该持久化用户信息。
             // 简化处理：如果 Store 里有 Token 但没用户信息，强制重新登录
             window.location.replace(AUTH_URL);
        }
        return;
    }

    // 3. 无 Token，重定向到登录页
    if (!accessToken && !currentToken) {
      window.location.replace(AUTH_URL);
    }
  }, [setAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 加载已注册的APP列表
    loadRegisteredApps();
  }, [isAuthenticated]);

  /**
   * 从admin-app获取已注册APP列表
   */
  async function loadRegisteredApps() {
    try {
      const token = useShellStore.getState().accessToken;
      const response = await fetch(`${ADMIN_APP_URL}/api/apps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success && result.data) {
        const apps = result.data.map(
          (app: { appId: string; appName: string; url: string; menuConfig: unknown[] }) => ({
            appId: app.appId,
            appName: app.appName,
            url: app.url || '',
            menus: app.menuConfig || [],
          })
        );
        setRegisteredApps(apps);
      }
    } catch {
      // 首次启动可能admin-app还未就绪，使用默认核心APP
      setRegisteredApps([
        {
          appId: 'admin',
          appName: 'APP管理',
          url: ADMIN_APP_URL,
          menus: [
            { key: 'app-list', label: 'APP列表', icon: 'LayoutGrid', path: '/' },
            { key: 'app-upload', label: '上传APP', icon: 'Upload', path: '/upload' },
          ],
        },
      ]);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          正在验证身份...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          <AppContainer />
        </main>
      </div>
    </div>
  );
}
