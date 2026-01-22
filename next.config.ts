/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-staycentralv2-1764836694677.cluster-cz5nqyh5nreq6ua6gaqd7okl7o.cloudworkstations.dev",
        "https://9000-firebase-staycentralv2-1764836694677.cluster-cz5nqyh5nreq6ua6gaqd7okl7o.cloudworkstations.dev",
    ]
  }
};

module.exports = nextConfig;
