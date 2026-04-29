# Acceptance Checklist - Astro Migration

## Visual parity
- Compare Home, Category, Product on desktop/tablet/mobile against approved baseline screenshots.
- Validate typography hierarchy, spacing rhythm, button style and footer structure.
- Confirm brand/logo blocks and category layout order match original storefront intent.

## Functional parity
- Header mobile menu opens/closes and supports ESC.
- Header search suggestions work and submit to `/search/?q=`.
- Catalog filters by query and brand, supports sort and "Ver mas" pagination.
- Product gallery swaps active image and keeps selected thumbnail state.
- WhatsApp CTA builds contextual message per page/product.

## SEO and routing
- Canonical is present on every route.
- OG/Twitter metadata is present from layout defaults or route-specific overrides.
- JSON-LD organization schema and product/breadcrumb schema are emitted where relevant.
- `sitemap.xml` and `robots.txt` are generated.
- Legacy redirects file (`public/_redirects`) includes index.php route mappings.

## Performance and quality
- `npm run check` passes.
- `npm run test` passes.
- `npm run build` passes and emits static routes.
- Validate no legacy plugin/runtime scripts are loaded in Astro pages.
