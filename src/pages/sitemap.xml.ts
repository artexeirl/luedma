import { routeIndex, siteSettings } from '../data/snapshot';
import { buildCanonical } from '../utils/seo';

export function GET() {
  const urls = Array.from(
    new Set(
      routeIndex
        .filter((route) => !route.seo.noindex)
        .map((route) => buildCanonical(siteSettings.siteUrl, route.path)),
    ),
  )
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
