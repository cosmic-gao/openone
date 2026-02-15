'use client';

import { useEffect, useState } from 'react';
import type { AppRegistration } from '@openone/types';
import { Package, Circle } from 'lucide-react';

/** 状态颜色映射 */
const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  published: '#22c55e',
  archived: '#64748b',
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
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
        加载中...
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-20">
        <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>暂无APP，点击上方按钮上传</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <div
          key={app.appId}
          className="rounded-xl border p-5 transition-all duration-200"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium">{app.appName}</h3>
            <div className="flex items-center gap-1.5 text-xs">
              <Circle size={8} fill={STATUS_COLORS[app.status]} color={STATUS_COLORS[app.status]} />
              {STATUS_LABELS[app.status]}
            </div>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {app.description || '暂无描述'}
          </p>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>ID: {app.appId}</span>
            <span>v{app.latestVersion || '0.0.0'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
