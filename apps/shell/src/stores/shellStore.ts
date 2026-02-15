import { create } from 'zustand';
import type { UserInfo, MenuItem } from '@openone/types';

/** 已注册的子APP信息 */
interface RegisteredApp {
    /** APP唯一标识 */
    appId: string;
    /** APP显示名称 */
    appName: string;
    /** APP访问地址 */
    url: string;
    /** APP菜单配置 */
    menus: MenuItem[];
}

/** Shell全局状态 */
interface ShellStore {
    /** 当前用户信息 */
    user: UserInfo | null;
    /** 访问令牌 */
    accessToken: string | null;
    /** 刷新令牌 */
    refreshToken: string | null;
    /** 是否已认证 */
    isAuthenticated: boolean;
    /** 已注册的子APP列表 */
    registeredApps: RegisteredApp[];
    /** 当前激活的APP ID */
    activeAppId: string | null;
    /** 当前激活的菜单Key */
    activeMenuKey: string | null;
    /** 侧边栏是否折叠 */
    isSidebarCollapsed: boolean;

    /** 设置认证信息 */
    setAuth: (user: UserInfo, accessToken: string, refreshToken: string) => void;
    /** 清除认证信息（登出） */
    clearAuth: () => void;
    /** 设置已注册的APP列表 */
    setRegisteredApps: (apps: RegisteredApp[]) => void;
    /** 设置当前激活的APP */
    setActiveApp: (appId: string, menuKey: string) => void;
    /** 切换侧边栏折叠状态 */
    toggleSidebar: () => void;
}

/**
 * Shell全局状态管理
 * 管理用户认证、子APP注册和菜单状态
 */
export const useShellStore = create<ShellStore>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    registeredApps: [],
    activeAppId: null,
    activeMenuKey: null,
    isSidebarCollapsed: false,

    setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

    clearAuth: () =>
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        }),

    setRegisteredApps: (apps) => set({ registeredApps: apps }),

    setActiveApp: (appId, menuKey) =>
        set({ activeAppId: appId, activeMenuKey: menuKey }),

    toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));

export type { RegisteredApp };
