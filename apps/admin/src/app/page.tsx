export default function Page() {
  return (
    <main className="p-6 font-sans">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        使用 API：POST /api/app/upload 上传附件（JSON），POST /api/app/publish 发布并同步。
      </p>
    </main>
  )
}
