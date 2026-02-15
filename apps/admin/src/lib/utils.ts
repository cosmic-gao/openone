import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function mergeClassName(...values: Array<ClassValue>): string {
  return twMerge(clsx(values))
}
