import { Shield } from 'lucide-react';

/**
 * 权限管理首页
 */
export default function PermissionPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-semibold">权限管理</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="权限定义" count={0} description="所有APP注册的权限总数" />
        <DashboardCard title="角色" count={0} description="已创建的角色总数" />
        <DashboardCard title="用户" count={0} description="已授权的用户总数" />
      </div>
    </div>
  );
}

/** 仪表盘卡片 */
function DashboardCard({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </h3>
      <p className="text-2xl font-bold mb-1">{count}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
    </div>
  );
}
