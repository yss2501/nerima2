import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/spots_template.csv',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/csv; charset=utf-8',
          },
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="spots_template.csv"',
          },
        ],
      },
      {
        source: '/spots_empty_template.csv',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/csv; charset=utf-8',
          },
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="spots_empty_template.csv"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
