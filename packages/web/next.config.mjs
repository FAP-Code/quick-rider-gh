/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
