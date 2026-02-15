export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ margin: 0 }}>Admin</h1>
      <p style={{ marginTop: 12 }}>
        使用 API：POST /api/app/upload 上传附件（JSON），POST /api/app/publish 发布并同步。
      </p>
    </main>
  )
}
