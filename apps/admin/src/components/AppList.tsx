'use client';

import { useEffect, useState } from 'react';
import type { AppRegistration } from '@openone/types';
import { Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

/**
 * APP列表组件
 */
export function AppList() {
  const [apps, setApps] = useState<AppRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      // 忽略首次加载错误
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-20">
        <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">暂无APP，点击上方按钮上传</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <Card
          key={app.appId}
          className="transition-colors hover:bg-accent/50 cursor-pointer"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{app.appName}</CardTitle>
              <Badge variant={STATUS_VARIANT[app.status] || 'secondary'}>
                {STATUS_LABELS[app.status] || app.status}
              </Badge>
            </div>
            <CardDescription>{app.description || '暂无描述'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ID: {app.appId}</span>
              <span>v{app.latestVersion || '0.0.0'}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
