import type { NextConfig } from "next";

/* STATIC_EXPORT=1 builds the fully static variant used by the GitHub Pages
   preview: no API routes, no header/rewrite support (Pages serves plain
   files), and NEXT_PUBLIC_BASE_PATH carries the "/<repo>" prefix. The normal
   server build is untouched. */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  /* WordPress fusion ("strangler" pattern): every path this app does not
     serve falls through to the existing WordPress site, so the domain can
     point here while WP keeps serving its own pages unchanged (wp-admin
     included). Set WP_ORIGIN_URL to the WP origin, e.g. after moving it to
     https://wp.hawaiipescara.it — leave it unset to disable the bridge. */
  async rewrites() {
    const wpOrigin = process.env.WP_ORIGIN_URL?.replace(/\/$/, "");

    if (!wpOrigin || isStaticExport) {
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
    if (isStaticExport) {
      return [];
    }

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
