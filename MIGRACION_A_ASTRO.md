# Migracion a Astro (Storefront)

## Estado actual
Implementacion ejecutada en `astro-frontend/` con enfoque server-first y islas TS.

## Fuente congelada
- Inventario local congelado en:
  - `src/data/site-inventory.json`

## Modelo tipado y snapshot
- Tipos centrales en `src/types/content.ts`:
  - `SiteSettings`, `NavItem`, `Category`, `Brand`, `Product`, `SeoMeta`, `RouteEntry`
- Snapshot comercial en:
  - `src/data/site-snapshot.json`
- Carga y validacion de snapshot en build:
  - `src/data/snapshot.ts`

## Capas Astro
- Layout base SEO/canonical/schema:
  - `src/layouts/BaseLayout.astro`
- Componentes reutilizables:
  - Header, Footer, Breadcrumbs, ProductCard, CatalogSection, WhatsAppFloat
- Rutas publicas:
  - Home, Search, Catalogo, Product, Product Category, Marca, Contact, About, Libro de reclamaciones
- Utilidades:
  - `src/utils/urls.ts`, `src/utils/seo.ts`, `src/utils/content.ts`

## Islas TypeScript
Implementadas en `src/scripts/islands/` y montadas por `bootstrap.ts`:
- `mobile-menu` (critica)
- `search` (critica)
- `catalog-controls` (defer)
- `product-gallery` (defer)
- `whatsapp-cta` (defer)

Montaje por `data-island` + `data-island-props` y carga diferida por viewport/interaccion.

## SEO y paridad de rutas
- Canonical, OpenGraph y Twitter tags por layout.
- JSON-LD Organization global + Product/Breadcrumb en detalle.
- `src/pages/sitemap.xml.ts` y `src/pages/robots.txt.ts`.
- Redirects legacy definidos en `public/_redirects`.
- Matriz de paridad documentada en `docs/url-parity-matrix.md`.

## Calidad y validacion
- Pruebas basicas vitest en `tests/`.
- Checklist de aceptacion en `docs/acceptance-checklist.md`.
- Comandos obligatorios previos a relanzamiento:
  - `npm run check`
  - `npm run test`
  - `npm run build`

## Nota sobre "pixel-perfect"
La estructura y estilo comercial quedaron migrados con alta fidelidad local y arquitectura preparada para ajuste fino visual en QA por screenshots comparativos (desktop/tablet/mobile).
