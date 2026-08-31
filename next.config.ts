import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Content-Security-Policy",
    value:
      `default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' https://cdn.plaid.com${isDevelopment ? " 'unsafe-eval'" : ""}; frame-src 'self' https://cdn.plaid.com; connect-src 'self' https://*.supabase.co https://sandbox.plaid.com; img-src 'self' data: https://images.unsplash.com;`
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive, nosnippet, noimageindex"
  }
];

const nextConfig: NextConfig = {
  // Keep the interactive walkthrough and release build from overwriting each
  // other's CSS/chunk manifests when they run at the same time.
  distDir: isDevelopment ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
