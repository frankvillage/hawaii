import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /* WordPress fusion ("strangler" pattern): every path this app does not
     serve falls through to the existing WordPress site, so the domain can
     point here while WP keeps serving its own pages unchanged (wp-admin
     included). Set WP_ORIGIN_URL to the WP origin, e.g. after moving it to
     https://wp.hawaiipescara.it — leave it unset to disable the bridge. */
  async rewrites() {
    const wpOrigin = process.env.WP_ORIGIN_URL?.replace(/\/$/, "");

    if (!wpOrigin) {
      return [];
    }

    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/:path*",
          destination: `${wpOrigin}/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
