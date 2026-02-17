import { LoginForm } from '@/components/LoginForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * 登录页面
 * 登录成功后重定向到Shell集成APP
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-purple-500" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl bg-gradient-to-br from-blue-500 to-cyan-500" />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto bg-gradient-to-br from-primary to-purple-500">
              <span className="text-2xl font-bold text-primary-foreground">O</span>
            </div>
            <CardTitle className="text-2xl">OpenOne</CardTitle>
            <CardDescription>多APP管理平台</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
