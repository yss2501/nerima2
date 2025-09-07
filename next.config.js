/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 静的エクスポート用の設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Next.js 15対応（experimental.esmExternalsは非推奨のため削除）
  // 静的エクスポート時の警告を抑制
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig
