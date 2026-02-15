'use client';

import { useShellStore } from '@/stores/shellStore';
import {
  LayoutGrid,
  Upload,
  Shield,
  Database,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

/** 图标名称到Lucide组件的映射 */
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  Upload,
  Shield,
  Database,
};

/**
 * 侧边栏组件
 * 展示所有注册APP的菜单，支持折叠
 */
export function Sidebar() {
  const {
    registeredApps,
    activeAppId,
    activeMenuKey,
    isSidebarCollapsed,
    setActiveApp,
    toggleSidebar,
  } = useShellStore();

  return (
    <aside
      className="flex flex-col h-full border-r transition-all duration-300"
      style={{
        width: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--color-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo区域 */}
      <div
        className="flex items-center gap-3 px-4 border-b shrink-0"
        style={{
          height: 'var(--header-height)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <span className="text-sm font-bold text-white">O</span>
        </div>
        {!isSidebarCollapsed && (
          <span className="text-base font-semibold whitespace-nowrap">OpenOne</span>
        )}
      </div>

      {/* 菜单区域 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {registeredApps.map((app) => (
          <div key={app.appId} className="mb-3">
            {/* APP分组标题 */}
            {!isSidebarCollapsed && (
              <div
                className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {app.appName}
              </div>
            )}

            {/* 菜单项 */}
            {app.menus.map((menu) => {
              const isActive = activeAppId === app.appId && activeMenuKey === menu.key;
              const IconComponent = menu.icon ? ICON_MAP[menu.icon] : LayoutGrid;

              return (
                <button
                  key={menu.key}
                  onClick={() => setActiveApp(app.appId, menu.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer"
                  style={{
                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                  title={isSidebarCollapsed ? menu.label : undefined}
                >
                  {IconComponent && <IconComponent size={18} className="shrink-0" />}
                  {!isSidebarCollapsed && <span>{menu.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 折叠按钮 */}
      <div
        className="flex items-center justify-center py-3 border-t shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
