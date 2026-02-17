import { AppList } from '@/components/AppList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * APP管理首页 - 展示已注册APP列表
 */
export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">APP 管理</h1>
        <Button asChild>
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" />
            上传APP
          </Link>
        </Button>
      </div>
      <AppList />
    </div>
  );
}
