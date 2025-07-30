/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  transpilePackages: ["rc-util", "@ant-design/icons-svg"],
  devIndicators: {
    buildActivity: false,
    position: "bottom-right",
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },



  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/ar/:path*",
        headers: [
          {
            key: "User-Agent",
            value: "Mozilla/5.0 (compatible; NextJS-Proxy/1.0)",
          },
          {
            key: "Accept",
            value: "application/json",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
