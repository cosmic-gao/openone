'use client';

import { useEffect, useRef } from 'react';
import { useShellStore } from '@/stores/shellStore';
import { LayoutGrid } from 'lucide-react';

/**
 * 子APP加载容器
 * 使用Wujie微前端框架动态加载子APP
 * 当Wujie不可用时（如开发初期），使用iframe降级
 */
export function AppContainer() {
  const { activeAppId, activeMenuKey, registeredApps, accessToken } = useShellStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeApp = registeredApps.find((app) => app.appId === activeAppId);
  const activeMenu = activeApp?.menus.find((m) => m.key === activeMenuKey);

  useEffect(() => {
    if (!activeApp || !containerRef.current) return;

    const url = `${activeApp.url}${activeMenu?.path || '/'}`;

    loadSubApp(activeApp.appId, url, containerRef.current);

    return () => {
      destroySubApp(activeApp.appId);
    };
  }, [activeAppId, activeMenuKey, activeApp, activeMenu]);

  /**
   * 加载子APP
   * 优先使用Wujie，降级为iframe
   */
  async function loadSubApp(appId: string, url: string, container: HTMLElement) {
    try {
      // 尝试使用Wujie加载
      const wujie = await import('wujie');
      wujie.startApp({
        name: appId,
        url,
        el: container,
        props: {
          token: accessToken,
        },
      });
    } catch {
      // Wujie不可用时使用iframe降级
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.id = `sub-app-${appId}`;
      container.appendChild(iframe);
    }
  }

  /**
   * 销毁子APP实例
   */
  async function destroySubApp(appId: string) {
    try {
      const wujie = await import('wujie');
      wujie.destroyApp(appId);
    } catch {
      // iframe模式下清空容器
      const iframe = document.getElementById(`sub-app-${appId}`);
      iframe?.remove();
    }
  }

  // 未选择任何APP时显示欢迎页
  if (!activeApp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <LayoutGrid size={36} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">欢迎使用 OpenOne</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            从左侧菜单选择一个APP开始使用
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      id={`app-container-${activeAppId}`}
    />
  );
}
