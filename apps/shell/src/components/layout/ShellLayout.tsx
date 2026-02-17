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
    // 从URL参数中提取Token（登录回调）
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
            email: '',
          },
          accessToken,
          refreshToken
        );
        // 清除URL参数
        window.history.replaceState({}, '', '/');
      }
    }

    if (!accessToken && !useShellStore.getState().isAuthenticated) {
      // 未登录，重定向到登录页
      window.location.href = AUTH_URL;
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
