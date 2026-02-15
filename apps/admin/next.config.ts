import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@openone/types", "@openone/auth"],
}

export default nextConfig
