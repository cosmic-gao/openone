import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openone/kernel", "@openone/authentication", "@openone/permission", "@openone/database"],
};

export default nextConfig;
