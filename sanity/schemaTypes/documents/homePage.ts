import {defineArrayMember, defineField, defineType} from 'sanity';

const validateWebp = (value: {asset?: {_ref?: string}} | undefined) => {
  if (!value?.asset?._ref) return true;
  return value.asset._ref.endsWith('-webp') ? true : 'La imagen debe estar en formato WEBP (.webp).';
};

const getValueAtPath = (root: unknown, path: Array<string | {_key: string}>): unknown => {
  let current: unknown = root;
  for (const segment of path) {
    if (typeof segment === 'string') {
      if (!current || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    if (!Array.isArray(current)) return undefined;
    current = current.find((item) => item && typeof item === 'object' && (item as {_key?: string})._key === segment._key);
  }
  return current;
};

export const homePageType = defineType({
  name: 'homePage',
  title: 'Página de Inicio',
  type: 'document',
  preview: {
    prepare() {
      return {
        title: 'Inicio',
        subtitle: 'Configuración de la página principal',
      };
    },
  },
  fields: [
    defineField({
      name: 'heroSlides',
      title: 'Banners principales',
      description:
        'Subir de 1 a 5 banners. Formato obligatorio: WEBP. Tamaño requerido desktop: 2560 x 1024px. Tamaño requerido móvil: 1000 x 1000px.',
      type: 'array',
      validation: (r) => r.required().min(1).max(5),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'imageDesktop',
              title: 'Imagen desktop',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.required().custom(validateWebp),
            }),
            defineField({
              name: 'imageMobile',
              title: 'Imagen móvil',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.custom(validateWebp),
            }),
            defineField({
              name: 'alt',
              title: 'ALT SEO',
              type: 'string',
              validation: (r) => r.required().min(5),
            }),
            defineField({
              name: 'link',
              title: 'Enlace del banner',
              description: 'Opcional. Ejemplo: /tienda/ o https://dominio.com',
              type: 'link',
            }),
          ],
          preview: {
            select: {title: 'alt', media: 'imageDesktop'},
          },
        }),
      ],
    }),
    defineField({
      name: 'featuredProductsByBrand',
      title: 'Productos destacados por marca',
      description: 'Configura aquí el selector por marca de la sección de productos destacados de la página Inicio.',
      type: 'array',
      validation: (r) => r.required().min(1).max(5),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'brand',
              title: 'Marca',
              type: 'reference',
              to: [{type: 'brand'}],
              options: {disableNew: true},
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'products',
              title: 'Productos',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'reference',
                  to: [{type: 'product'}],
                  options: {
                    disableNew: true,
                    filter: ({document, parentPath}) => {
                      const blockPath = (parentPath || []).slice(0, -1) as Array<string | {_key: string}>;
                      const blockValue = getValueAtPath(document, blockPath) as
                        | {brand?: {_ref?: string}; products?: Array<{_ref?: string}>}
                        | undefined;
                      const brandRef = blockValue?.brand?._ref;
                      const selectedProductRefs = (blockValue?.products || [])
                        .map((item) => item?._ref)
                        .filter((ref): ref is string => typeof ref === 'string' && ref.length > 0);

                      if (!brandRef) {
                        return {
                          filter: '_type == "product" && false',
                        };
                      }

                      const publishedBrandId = brandRef.replace(/^drafts\./, '');
                      return {
                        filter:
                          '_type == "product" && brand._ref in [$draftBrandId, $publishedBrandId] && !(_id in $excludedProductIds)',
                        params: {
                          draftBrandId: `drafts.${publishedBrandId}`,
                          publishedBrandId,
                          excludedProductIds: selectedProductRefs,
                        },
                      };
                    },
                  },
                }),
              ],
              validation: (r) => r.required().min(1).max(8),
            }),
          ],
          preview: {
            select: {
              brandName: 'brand.name',
              products: 'products',
            },
            prepare({brandName, products}) {
              const count = Array.isArray(products) ? products.length : 0;
              return {
                title: brandName || 'Marca sin definir',
                subtitle: `${count} producto(s) asignado(s)`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'promoBanners',
      title: 'Banners promocionales',
      description:
        'Subir exactamente 2 banners. Formato obligatorio: WEBP. Tamaño requerido: 1000 x 1000px.',
      type: 'array',
      validation: (r) => r.required().min(2).max(2),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Imagen',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.required().custom(validateWebp),
            }),
            defineField({
              name: 'alt',
              title: 'ALT SEO',
              type: 'string',
              validation: (r) => r.required().min(5),
            }),
            defineField({
              name: 'link',
              title: 'Enlace del banner',
              description: 'Opcional. Ejemplo: /tienda/ o https://dominio.com',
              type: 'link',
            }),
          ],
          preview: {
            select: {title: 'alt', media: 'image'},
          },
        }),
      ],
    }),
    defineField({
      name: 'featuredProductsCarousel',
      title: 'Productos destacados (carrusel)',
      description:
        'Selecciona entre 4 y 12 productos para la sección "Productos destacados" del Home. Este bloque es independiente del selector por marca.',
      type: 'array',
      validation: (r) => r.required().min(4).max(12).unique(),
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'product'}],
          options: {
            disableNew: true,
            filter: ({parent}) => {
              const selectedProductIds = Array.isArray(parent)
                ? parent
                    .map((item) => (item && typeof item === 'object' ? (item as {_ref?: string})._ref : undefined))
                    .filter((id): id is string => typeof id === 'string' && id.length > 0)
                : [];

              return {
                filter: '_type == "product" && !(_id in $selectedProductIds)',
                params: {selectedProductIds},
              };
            },
          },
        }),
      ],
    }),
  ],
});
