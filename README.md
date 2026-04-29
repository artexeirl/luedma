# Astro Storefront - Maquinarias Luedma

Migracion local del storefront a Astro con paridad visual/estructural y arquitectura por islas en TypeScript.

## Stack
- Astro server-first
- TypeScript estricto
- Islas nativas TS (sin React/Preact)
- Snapshot local tipado

## Scripts
- `npm run dev` desarrollo local
- `npm run check` validacion de tipos Astro
- `npm run test` regresion basica de rutas/utilidades
- `npm run build` build estatico

## Rutas clave
- `/` Home
- `/search/` Busqueda local
- `/catalogo/` Catalogo completo
- `/product/:slug/` Producto
- `/product-category/:...slug/` Categoria
- `/marca/:slug/` Marca
- `/contact/`, `/about-us/`, `/libro-de-reclamaciones/`

## Documentacion
- `MIGRACION_A_ASTRO.md`
- `docs/acceptance-checklist.md`
- `docs/url-parity-matrix.md`
