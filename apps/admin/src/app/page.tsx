import { AppList } from '@/components/AppList';

/**
 * APP管理首页 - 展示已注册APP列表
 */
export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">APP 管理</h1>
        <a
          href="/upload"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          上传APP
        </a>
      </div>
      <AppList />
    </div>
  );
}
