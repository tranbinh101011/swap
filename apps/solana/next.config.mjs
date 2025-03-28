import bundleAnalyzer from '@next/bundle-analyzer'

import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin'
import { RetryChunkLoadPlugin } from 'webpack-retry-chunk-load-plugin'

const withVanillaExtract = createVanillaExtractPlugin()
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: [
    '@pancakeswap/localization',
    '@pancakeswap/hooks',
    '@pancakeswap/utils',
    '@pancakeswap/tokens',
    '@pancakeswap/farms',
    '@pancakeswap/widgets-internal',
    // https://github.com/TanStack/query/issues/6560#issuecomment-1975771676
    '@tanstack/query-core',
  ],
  experimental: {
    optimizePackageImports: ['@pancakeswap/widgets-internal', '@pancakeswap/uikit'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/swap',
        permanent: false,
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.plugins.push(
      new RetryChunkLoadPlugin({
        cacheBust: `function() {
          return 'cache-bust=' + Date.now();
        }`,
        retryDelay: `function(retryAttempt) {
          return 2 ** (retryAttempt - 1) * 500;
        }`,
        maxRetries: 5,
      }),
    )
    return webpackConfig
  },
}

// Create a custom headers wrapper
const withCustomHeaders = (config) => ({
  ...config,
  async headers() {
    const defaultHeaders = await (config.headers?.() ?? [])
    return [
      ...defaultHeaders,
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // allow wallet popups
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.solflare.com",
          },
        ],
      },
    ]
  },
})

export default withBundleAnalyzer(withVanillaExtract(withCustomHeaders(nextConfig)))
