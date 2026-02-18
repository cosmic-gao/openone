'use client';

import { useEffect, useState } from 'react';
import type { AppRegistration } from '@openone/types';
import { Package, Settings, Edit, Trash2, MoreHorizontal, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppEditModal } from './AppEditModal';
import { EnvEditModal } from './EnvEditModal';
import { toast } from 'sonner';

/** 状态标签变体映射 */
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

/** 状态标签映射 */
const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

interface AppListProps {
  onUpload: () => void;
}

export function AppList({ onUpload }: AppListProps) {
  const [apps, setApps] = useState<AppRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [editingApp, setEditingApp] = useState<AppRegistration | null>(null);
  const [envApp, setEnvApp] = useState<AppRegistration | null>(null);
  const [envData, setEnvData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    try {
      const response = await fetch('/api/apps');
      const result = await response.json();
      if (result.success) {
        setApps(result.data || []);
      }
    } catch {
      toast.error('加载APP列表失败');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Edit App (Open Modal)
  const handleEdit = (app: AppRegistration) => {
    setEditingApp(app);
  };

  // Handle Save App Info
  const saveAppInfo = async (id: string, data: Partial<AppRegistration>) => {
    try {
       toast.info('更新功能尚未对接后端API');
       setApps(apps.map(app => app.appId === id ? { ...app, ...data } : app));
    } catch (error) {
        throw error;
    }
  };

  // Handle Env (Open Modal)
  const handleEnv = async (app: AppRegistration) => {
    try {
        setEnvData({}); // Reset or set fetched data
        setEnvApp(app);
    } catch (error) {
        toast.error('获取环境变量失败');
    }
  };

  // Handle Save Env
  const saveEnv = async (data: Record<string, string>) => {
    if (!envApp) return;
    try {
        console.log('Saving env for', envApp.appId, data);
        toast.success(`环境变量已更新 (模拟)`);
    } catch (error) {
        throw error;
    }
  };

  // Handle Delete
  const handleDelete = async (appId: string) => {
    if (!confirm('确定要删除这个APP吗？此操作无法撤销。')) return;
    
    try {
        toast.info('删除功能尚未对接后端API');
        setApps(apps.filter(app => app.appId !== appId));
    } catch (error) {
        toast.error('删除失败');
    }
  };

  // Pagination Logic
  const totalItems = apps.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const currentApps = apps.slice(startIdx, startIdx + pageSize);

  if (isLoading) {
    return <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        ))}
    </div>;
  }

  // Remove early return for empty state to keep layout and pagination visible
  // if (apps.length === 0) { ... }


  return (
    <div className="flex flex-col h-full">
      {/* Table Container - Scrollable */}
      <div className={`flex-1 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm relative shadow-sm ${apps.length > 0 ? 'overflow-auto' : 'overflow-hidden'}`}>
        <table className="w-full caption-bottom text-sm h-full">
          <TableHeader className="sticky top-0 bg-background/80 z-20 shadow-sm backdrop-blur-md">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="w-[80px] pl-6 text-muted-foreground font-medium">图标</TableHead>
              <TableHead className="w-[250px] text-muted-foreground font-medium">APP 信息</TableHead>
              <TableHead className="text-muted-foreground font-medium">状态</TableHead>
              <TableHead className="text-muted-foreground font-medium">版本</TableHead>
              <TableHead className="w-[200px] text-muted-foreground font-medium">描述</TableHead>
              <TableHead className="text-right pr-6 text-muted-foreground font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentApps.length === 0 ? (
                <TableRow className="h-full hover:bg-transparent border-0">
                    <TableCell colSpan={6} className="text-center align-middle h-full border-0 p-0">
                        <div className="flex flex-col items-center justify-center h-full min-h-[500px] animate-in fade-in duration-700">
                            
                            <div className="relative mb-8 group cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-violet-500/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:scale-110" />
                                <div className="relative bg-gradient-to-br from-card to-muted p-8 rounded-3xl border border-border/50 shadow-xl shadow-primary/5 group-hover:-translate-y-1 transition-transform duration-300">
                                    <Package size={64} className="text-primary/80" strokeWidth={1} />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                暂无应用程序
                            </h3>
                            
                            <p className="max-w-[300px] mx-auto mb-10 text-muted-foreground leading-relaxed text-balance">
                                您还没有创建任何应用程序。开始构建您的第一个应用，开启无限可能。
                            </p>
                            
                            <Button 
                                onClick={onUpload} 
                                size="lg"
                                className="px-8 h-12 rounded-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span>创建第一个 APP</span>
                                </div>
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            ) : (
                currentApps.map((app, index) => (
              <TableRow key={app.appId} className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all duration-200">
                <TableCell className="pl-6 py-5">
                    <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center text-white font-bold text-xl select-none ring-1 ring-black/5 transition-transform group-hover:scale-105 duration-300
                        ${['bg-gradient-to-br from-rose-400 to-rose-600', 'bg-gradient-to-br from-blue-400 to-blue-600', 'bg-gradient-to-br from-emerald-400 to-emerald-600', 'bg-gradient-to-br from-amber-400 to-amber-600', 'bg-gradient-to-br from-violet-400 to-violet-600'][index % 5]}`}>
                        {app.appName.substring(0, 1).toUpperCase()}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-base text-foreground tracking-tight">{app.appName}</span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5 opacity-70">ID: {app.appId}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status] || 'secondary'} className="rounded-md px-2.5 py-0.5 font-normal shadow-sm border-0">
                        {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                         <span className="text-sm font-medium text-foreground/80">v{app.latestVersion || '0.0.0'}</span>
                         <span className="text-xs text-muted-foreground">最新版本</span>
                    </div>
                </TableCell>
                <TableCell className="max-w-[250px]">
                    <p className="truncate text-sm text-muted-foreground/80" title={app.description}>
                        {app.description || '暂无描述'}
                    </p>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 px-3 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/50 shadow-sm transition-colors"
                        onClick={() => handleEdit(app)}
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        编辑
                    </Button>

                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 px-3 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200/50 shadow-sm transition-colors"
                        onClick={() => handleEnv(app)}
                    >
                        <Settings className="h-3.5 w-3.5 mr-1.5" />
                        配置
                    </Button>

                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 shadow-sm transition-colors"
                        onClick={() => handleDelete(app.appId)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/50">
        <div className="text-sm text-muted-foreground">
           共 {totalItems} 条记录
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 text-sm font-medium">
                {/* Simple Page Size Selector */}
                <span className="text-muted-foreground">每页行数</span>
                <select 
                    className="h-8 w-[70px] rounded-md border border-input bg-secondary/50 px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    {[10, 20, 30, 50].map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
                第 {currentPage} / {totalPages || 1} 页
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="secondary" size="icon" className="h-8 w-8 p-0 bg-secondary/50 hover:bg-secondary rounded-full" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                    <span className="sr-only">上一页</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </Button>
                <Button variant="secondary" size="icon" className="h-8 w-8 p-0 bg-secondary/50 hover:bg-secondary rounded-full" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                    <span className="sr-only">下一页</span>
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </Button>
            </div>
        </div>
      </div>

      {editingApp && (
        <AppEditModal
          isOpen={!!editingApp}
          onClose={() => setEditingApp(null)}
          app={editingApp}
          onSave={saveAppInfo}
        />
      )}

      {envApp && (
        <EnvEditModal
          isOpen={!!envApp}
          onClose={() => setEnvApp(null)}
          appId={envApp.appId}
          appName={envApp.appName}
          initialEnv={envData}
          onSave={saveEnv}
        />
      )}
    </div>
  );
}
