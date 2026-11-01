import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [70, 75, 85],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Les navigateurs demandent /favicon.ico d'office : on y sert le favicon PNG.
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/favicon.png" },
      { source: "/llms.txt", destination: "/api/llms" },
    ];
  },
  async redirects() {
    return [
      { source: "/univers/evenements-corporate", destination: "/univers/evenementiel", permanent: true },
      { source: "/univers/stands-personnalises", destination: "/univers/realisation-stands", permanent: true },
      { source: "/univers/gestion-deleguee", destination: "/", permanent: true },
      // Adresses de l'ancien site WordPress, encore connues de Google.
      { source: "/lp-houd-li", destination: "/", permanent: true },
      { source: "/404-2", destination: "/", permanent: true },
      { source: "/hello-world", destination: "/blog", permanent: true },
      { source: "/feed", destination: "/blog", permanent: true },
      { source: "/comments/feed", destination: "/blog", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
