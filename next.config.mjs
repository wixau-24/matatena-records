/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES_EXPORT === '1';

const nextConfig = {
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: '/matatena-records',
        images: { unoptimized: true }
      }
    : {})
};

export default nextConfig;
