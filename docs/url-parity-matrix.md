# URL Parity Matrix

## Preserved storefront routes
- `/`
- `/search/`
- `/c/`
- `/contact/`
- `/about-us/`
- `/libro-de-reclamaciones/`
- `/product/:slug/`
- `/product-category/:...slug/`
- `/marca/:slug/`

## Redirect strategy
Defined in `public/_redirects`:
- `/index.php/product-category/* -> /product-category/:splat` (301)
- `/index.php/product/* -> /product/:splat` (301)
- `/index.php/marca/* -> /marca/:splat` (301)
- `/?page_id=82 -> /search/` (301)

## Inventory source
- Frozen file: `src/data/site-inventory.json`
- Commercial snapshot: `src/data/site-snapshot.json`
