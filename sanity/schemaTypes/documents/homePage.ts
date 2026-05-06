import {defineArrayMember, defineField, defineType} from 'sanity';

const validateWebp = (value: {asset?: {_ref?: string}} | undefined) => {
  if (!value?.asset?._ref) return true;
  return value.asset._ref.endsWith('-webp') ? true : 'La imagen debe estar en formato WEBP (.webp).';
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
        'Debes cargar de 1 a 5 banners. Formato obligatorio: WEBP. Tamaño requerido desktop: 2560x1024 px. Tamaño requerido móvil: 1000x1000 px.',
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
      description: 'Configura aquí el selector por marca de la sección de productos destacados de Inicio.',
      type: 'array',
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
              of: [defineArrayMember({type: 'reference', to: [{type: 'product'}], options: {disableNew: true}})],
              validation: (r) => r.required().min(1).max(12),
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
        'Puedes cargar de 1 a 3 banners. Formato obligatorio: WEBP. Tamaño requerido: 1024x983 px.',
      type: 'array',
      validation: (r) => r.required().min(1).max(3),
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
          ],
          preview: {
            select: {title: 'alt', media: 'image'},
          },
        }),
      ],
    }),
  ],
});
