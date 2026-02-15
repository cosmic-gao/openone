export default function OverviewPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Hi, Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">这里是主应用（Gateway）提供的统一布局与菜单。</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Apps</div>
          <div className="mt-2 text-2xl font-semibold">4</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Permission</div>
          <div className="mt-2 text-2xl font-semibold">Enabled</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Database</div>
          <div className="mt-2 text-2xl font-semibold">Schemas</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Admin</div>
          <div className="mt-2 text-2xl font-semibold">Publish</div>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-medium">Micro Frontend</div>
        <p className="mt-1 text-sm text-muted-foreground">
          左侧菜单进入各子应用，子应用通过无界微前端（Wujie）以 iframe + WebComponent 隔离方式运行。
        </p>
      </div>
    </main>
  )
}

