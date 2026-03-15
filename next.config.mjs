/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["recharts", "@hugeicons/core-free-icons"],
  },
}

export default nextConfig
