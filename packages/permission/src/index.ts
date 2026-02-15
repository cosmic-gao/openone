import type { PermissionCode, PermissionGate, PermissionSet, PlatformError, Plug, Result, UserContext } from "@openone/types"

export type PermissionService = Readonly<{
  /**
   * 从 PermissionApplication 加载用户权限集。
   *
   * @param userId 目标用户标识。
   * @param applicationKey 应用范围标识。
   * @returns 权限集结果。
   * @throws Error 远程服务不可达时抛出。
   */
  getPermissionSet: (input: { userId: string; applicationKey: string }) => Promise<Result<PermissionSet, PlatformError>>
}>

/**
 * 创建由 PermissionService 驱动的 PermissionGate。
 *
 * @param permissionService 权限服务适配器。
 * @returns 权限门。
 * @throws Error 适配器无效时抛出。
 * @example
 * const perm = gate(permissionService)
 * const isAllowed = await perm.hasPermission(context, "crm:user:list")
 */
export function gate(permissionService: PermissionService): PermissionGate {
  return {
    async hasPermission(context: UserContext, permissionCode: PermissionCode): Promise<boolean> {
      const applicationKey = permissionCode.split(":")[0] || ""
      const result = await permissionService.getPermissionSet({
        userId: context.userId,
        applicationKey,
      })

      if (!result.isSuccess) {
        return false
      }

      return result.value.codes.includes(permissionCode)
    },

    async getPermissionSet(query): Promise<PermissionSet> {
      const result = await permissionService.getPermissionSet({
        userId: query.userId,
        applicationKey: query.applicationKey,
      })

      if (!result.isSuccess) {
        throw new Error(result.error.message)
      }

      return result.value
    },
  }
}

export function plugin(permissionService: PermissionService): Plug {
  return {
    name: "perm",
    setup(kernel) {
      kernel.set("perm", gate(permissionService))
    },
  }
}
