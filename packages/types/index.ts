// APP配置相关
export type {
    AppConfig,
    MenuItem,
    PermissionDefinition,
    DatabaseConfig,
} from './app';

// 认证相关
export type {
    UserInfo,
    TokenPayload,
    LoginRequest,
    LoginResponse,
} from './auth';

// 权限相关
export type {
    Permission,
    Role,
    PermissionSyncRequest,
    PermissionCheckRequest,
    PermissionCheckResponse,
} from './permission';

// 数据库相关
export type {
    SchemaStatus,
    SchemaInfo,
    SchemaSyncRequest,
    MigrationFile,
    SchemaSyncResult,
    MigrationHistory,
} from './database';

// 平台通用类型
export type {
    AppStatus,
    AppRegistration,
    AppVersion,
    ApiResponse,
    PaginationParams,
    PaginatedResponse,
    BusEvents,
} from './platform';

// 环境变量管理
export type {
    EnvOwner,
    AppEnvConfig,
    EnvAssignment,
    PortAssignment,
    EnvAssignRequest,
    EnvAssignResponse,
} from './env';
