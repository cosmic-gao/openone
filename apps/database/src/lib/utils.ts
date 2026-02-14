import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并条件类名并解决 Tailwind 冲突。
 *
 * @param values 类名值。
 * @returns 合并后的类名字符串。
 * @example
 * const className = mergeClassName("px-2", isActive && "text-primary")
 */
export function mergeClassName(...values: Array<ClassValue>): string {
  return twMerge(clsx(values))
}
