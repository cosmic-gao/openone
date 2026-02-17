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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      className={cn(
        'flex flex-col h-full border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isSidebarCollapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Logo区域 */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-purple-500">
          <span className="text-sm font-bold text-primary-foreground">O</span>
        </div>
        {!isSidebarCollapsed && (
          <span className="text-base font-semibold whitespace-nowrap">OpenOne</span>
        )}
      </div>

      <Separator />

      {/* 菜单区域 */}
      <ScrollArea className="flex-1">
        <nav className="py-3 px-2">
          {registeredApps.map((app) => (
            <div key={app.appId} className="mb-3">
              {/* APP分组标题 */}
              {!isSidebarCollapsed && (
                <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {app.appName}
                </div>
              )}

              {/* 菜单项 */}
              {app.menus.map((menu) => {
                const isActive = activeAppId === app.appId && activeMenuKey === menu.key;
                const IconComponent = menu.icon ? ICON_MAP[menu.icon] : LayoutGrid;

                const menuButton = (
                  <button
                    key={menu.key}
                    onClick={() => setActiveApp(app.appId, menu.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    {IconComponent && <IconComponent size={18} className="shrink-0" />}
                    {!isSidebarCollapsed && <span>{menu.label}</span>}
                  </button>
                );

                // 折叠时用 Tooltip 显示菜单名
                if (isSidebarCollapsed) {
                  return (
                    <Tooltip key={menu.key}>
                      <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                      <TooltipContent side="right">{menu.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return menuButton;
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 折叠按钮 */}
      <div className="flex items-center justify-center py-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </aside>
  );
}
