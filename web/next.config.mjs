/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-auth", "better-sqlite3"],
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok.app", "*.ngrok-free.app"],
};

export default nextConfig;
