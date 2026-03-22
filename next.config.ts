import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Remove static export for i18n support
  // output: 'export',
  // distDir: 'out',
  basePath: '',
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
