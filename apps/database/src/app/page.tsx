import { Database } from 'lucide-react';

/**
 * 数据库管理首页
 * 展示所有Schema的概览
 */
export default function DbManagerPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={24} style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-semibold">数据库管理</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard title="活跃Schema" count={0} description="当前运行中的APP Schema" />
        <DashboardCard title="迁移记录" count={0} description="累计执行的迁移次数" />
      </div>

      <div className="mt-6">
        <h2 className="text-base font-medium mb-3">Schema 列表</h2>
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <Database size={36} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            暂无Schema，上传APP后会自动创建
          </p>
        </div>
      </div>
    </div>
  );
}

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
