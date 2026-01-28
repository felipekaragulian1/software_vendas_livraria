/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Para Docker: gera build standalone
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  // Configurações para produção
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
