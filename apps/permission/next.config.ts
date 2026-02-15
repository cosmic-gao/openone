import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openone/types", "@openone/authentication", "@openone/permission", "@openone/database"],
};

export default nextConfig;
