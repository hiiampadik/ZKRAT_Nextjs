/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  ...(isGithubPages && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
  ...(!isGithubPages && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.sanity.io',
        },
      ],
    },
  }),
}

