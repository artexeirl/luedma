# Sanity Setup (Luedma)

1. Copia `.env.example` a `.env` y completa:
- `PUBLIC_SANITY_PROJECT_ID`
- `PUBLIC_SANITY_DATASET`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

2. Levantar Studio:

```bash
npm run studio:dev
```

3. Tipos de contenido disponibles:
- Producto
- Categoría
- Marca
- Página de Inicio (singleton)
- Ajustes del Sitio (singleton)

4. Uso recomendado:
- Carga primero `Categorías` y `Marcas`.
- Luego crea `Productos`.
- Finalmente configura `Página de Inicio` (banners desktop/móvil, productos destacados, marcas top) y `Ajustes del Sitio`.
