export type ApplicationKey = string
export type TenantId = string
export type UserId = string

export type PermissionCode = string

export type IsoTime = string

export type RequestId = string

export type Result<TValue, TError> =
  | { isSuccess: true; value: TValue }
  | { isSuccess: false; error: TError }

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"

export type PlatformError = Readonly<{
  code: ErrorCode
  message: string
  requestId?: RequestId
}>

export type UserContext = Readonly<{
  tenantId: TenantId
  userId: UserId
  sessionId: string
}>

export type PermissionQuery = Readonly<{
  applicationKey: ApplicationKey
  userId: UserId
}>

export type PermissionSet = Readonly<{
  version: string
  codes: ReadonlyArray<PermissionCode>
}>

export type AuditRecord = Readonly<{
  requestId: RequestId
  tenantId: TenantId
  userId?: UserId
  action: string
  target?: string
  timestamp: IsoTime
  detail?: Record<string, unknown>
}>

export type AuditWriter = Readonly<{
  /**
   * 写入不可变审计记录。
   *
   * @param record 需要持久化的审计记录。
   * @returns 成功或平台错误的结果。
   * @throws Error 底层存储发生非预期失败时抛出。
   * @example
   * const result = await auditWriter.write({
   *   requestId: "req_1",
   *   tenantId: "tenant_1",
   *   userId: "user_1",
   *   action: "PermissionGranted",
   *   timestamp: new Date().toISOString(),
   * })
   */
  write: (record: AuditRecord) => Promise<Result<void, PlatformError>>
}>

export type PermissionGate = Readonly<{
  /**
   * 校验用户是否拥有指定权限。
   *
   * @param context 当前已认证的用户上下文。
   * @param permissionCode 需要校验的权限码。
   * @returns 拥有权限则返回 true。
   * @throws Error 权限查询发生非预期失败时抛出。
   * @example
   * const isAllowed = await permissionGate.hasPermission(context, "crm:user:list")
   */
  hasPermission: (context: UserContext, permissionCode: PermissionCode) => Promise<boolean>

  /**
   * 加载用户在指定应用范围内的完整权限集。
   *
   * @param query 查询信息。
   * @returns 带版本号的权限集（用于缓存失效）。
   * @throws Error 权限查询发生非预期失败时抛出。
   * @example
   * const set = await permissionGate.getPermissionSet({ applicationKey: "crm", userId: "user_1" })
   */
  getPermissionSet: (query: PermissionQuery) => Promise<PermissionSet>
}>

export type Plug = Readonly<{
  name: string
  setup?: (kernel: Kernel) => void
}>

export type Kernel = Readonly<{
  use: (plug: Plug) => Kernel
  set: (key: string, value: unknown) => void
  get: <TValue = unknown>(key: string) => TValue | undefined
}>
