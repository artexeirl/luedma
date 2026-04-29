import { routeIndex, siteSettings } from '../data/snapshot';
import { buildCanonical } from '../utils/seo';

export function GET() {
  const urls = routeIndex
    .map((route) => `<url><loc>${buildCanonical(siteSettings.siteUrl, route.path)}</loc></url>`)
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
