import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // 临时禁用图片优化以测试
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wardrobe-imagess.oss-cn-beijing.aliyuncs.com',
        port: '',
        pathname: '/wardrobe/**',
      },
      // 支持所有阿里云OSS北京区域域名（通配符）
      {
        protocol: 'https',
        hostname: '*.oss-cn-beijing.aliyuncs.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 启用现代图片格式以提升性能
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
