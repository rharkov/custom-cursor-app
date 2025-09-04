/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this option to solve the build error
  transpilePackages: ["framer-motion"],
};

export default nextConfig;
