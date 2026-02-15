import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openone/types", "@openone/auth", "@openone/permission", "@openone/database"],
};

export default nextConfig;
