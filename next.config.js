import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    domains: ['uqentra.com', 'skymark-ai.vercel.app'], // Add any other image domains here
  },
};

export default nextConfig;
