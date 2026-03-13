/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack désactivé (problème de stabilité sur Windows)
  // turbopack: {},

  // Optimisation images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/api/sms-webhook',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
