import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const productionOrigin = process.env.NEXT_PUBLIC_DOMAIN?.replace(/^https?:\/\//, '');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...(productionOrigin ? [productionOrigin] : []),
      ],
    },
  },
};

export default withNextIntl(nextConfig);
