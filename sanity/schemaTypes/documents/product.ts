import {defineArrayMember, defineField, defineType} from 'sanity';
import {ROOT_CATEGORIES, SUBCATEGORY_OPTIONS} from '../productCategories';

function subcategoryField(rootSlug: string, fieldName: string, title: string) {
  return defineField({
    name: fieldName,
    title,
    type: 'string',
    options: {list: SUBCATEGORY_OPTIONS[rootSlug], layout: 'dropdown'},
    hidden: ({document}) => (document as {categoryRoot?: string} | undefined)?.categoryRoot !== rootSlug,
    validation: (r) =>
      r.custom((value, context) => {
        const categoryRoot = (context.document as {categoryRoot?: string} | undefined)?.categoryRoot;
        if (categoryRoot !== rootSlug) return true;
        return value ? true : 'Selecciona una subcategoria.';
      }),
  });
}

export const productType = defineType({
  name: 'product',
  title: 'Producto',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Nombre', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 110},
      validation: (r) => r.required(),
    }),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({
      name: 'brand',
      title: 'Marca',
      type: 'reference',
      to: [{type: 'brand'}],
      options: {disableNew: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categoryRoot',
      title: 'Categoria principal',
      type: 'string',
      options: {list: ROOT_CATEGORIES, layout: 'dropdown'},
      validation: (r) => r.required(),
    }),
    subcategoryField('accesorios-de-herramientas', 'subcategoryAccesorios', 'Subcategoria'),
    subcategoryField('equipos-de-taller', 'subcategoryConstruccion', 'Subcategoria'),
    subcategoryField('herramientas-electricas', 'subcategoryElectricas', 'Subcategoria'),
    subcategoryField('herramientas-manuales', 'subcategoryManuales', 'Subcategoria'),
    subcategoryField('seguridad-e-iluminacion', 'subcategorySeguridad', 'Subcategoria'),
    defineField({
      name: 'shortDescription',
      title: 'Descripcion corta',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'description',
      title: 'Descripcion completa',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'technicalSheet',
      title: 'Información técnica',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'price',
      title: 'Precio',
      type: 'number',
      validation: (r) => r.required().positive(),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Precio anterior',
      type: 'number',
      validation: (r) =>
        r.custom((value, context) => {
          if (value == null) return true;
          const price = (context.document as {price?: number})?.price;
          if (typeof price === 'number' && value < price) return 'El precio anterior debe ser mayor o igual al precio actual.';
          return true;
        }),
    }),
    defineField({
      name: 'stock',
      title: 'Stock',
      type: 'number',
      initialValue: 0,
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: 'isNew',
      title: 'Etiqueta NUEVO',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'images',
      title: 'Imagenes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
              validation: (r) => r.required(),
            }),
          ],
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({name: 'featured', title: 'Producto destacado', type: 'boolean', initialValue: false}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'sku',
      media: 'images.0.asset',
      stock: 'stock',
      categoryRoot: 'categoryRoot',
      subA: 'subcategoryAccesorios',
      subC: 'subcategoryConstruccion',
      subE: 'subcategoryElectricas',
      subM: 'subcategoryManuales',
      subS: 'subcategorySeguridad',
    },
    prepare({title, subtitle, media, stock, categoryRoot, subA, subC, subE, subM, subS}) {
      const subcategory = subA || subC || subE || subM || subS || categoryRoot;
      return {
        title,
        subtitle: `${subtitle || 'Sin SKU'} · ${subcategory || 'Sin categoria'} · ${
          typeof stock === 'number' && stock > 0 ? 'Stock disponible' : 'Sin stock'
        }`,
        media,
      };
    },
  },
});
