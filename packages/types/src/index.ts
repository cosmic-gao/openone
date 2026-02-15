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
  write: (record: AuditRecord) => Promise<Result<void, PlatformError>>
}>

export type PermissionGate = Readonly<{
  hasPermission: (context: UserContext, permissionCode: PermissionCode) => Promise<boolean>
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

