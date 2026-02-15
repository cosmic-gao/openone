import { LoginForm } from '@/components/LoginForm';

/**
 * 登录页面
 * 登录成功后重定向到Shell集成APP
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
        />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        <div
          className="rounded-2xl border p-8 backdrop-blur-xl shadow-2xl"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Logo & 标题 */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              <span className="text-2xl font-bold text-white">O</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">OpenOne</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              多APP管理平台
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
