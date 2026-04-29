import {defineArrayMember, defineField, defineType} from 'sanity';

const ROOT_CATEGORIES = [
  {title: 'Accesorios de Herramientas', value: 'accesorios-de-herramientas'},
  {title: 'Equipos de Construcción', value: 'equipos-de-taller-y-construccion'},
  {title: 'Herramientas Eléctricas', value: 'herramientas-electricas'},
  {title: 'Herramientas Manuales', value: 'herramientas-manuales'},
  {title: 'Seguridad e Iluminación', value: 'seguridad-e-iluminacion'},
];

const SUBCATEGORY_OPTIONS: Record<string, Array<{title: string; value: string}>> = {
  'accesorios-de-herramientas': [
    {title: 'Accesorios Abrasivos', value: 'accesorios-abrasivos'},
    {title: 'Brocas y Puntas', value: 'brocas-y-puntas'},
    {title: 'Discos', value: 'discos'},
    {title: 'Hojas de Sierra', value: 'hojas-sierra'},
    {title: 'Juego de Llaves de Vaso', value: 'juego-de-llaves-de-vaso'},
    {title: 'Sierra Copa', value: 'sierra-copa'},
  ],
  'equipos-de-taller-y-construccion': [
    {title: 'Equipos de Levantamiento y Carga', value: 'equipos-de-levantamiento-y-carga'},
    {title: 'Equipos de Medición', value: 'equipos-de-medicion'},
    {title: 'Organización y Almacenamiento', value: 'organizacion-y-almacenamiento'},
  ],
  'herramientas-electricas': [
    {title: 'Amoladoras y Pulidoras', value: 'amoladoras-y-pulidoras'},
    {title: 'Baterías y Cargadores', value: 'baterias-y-cargadores'},
    {title: 'Bombas de Agua', value: 'bomba-agua'},
    {title: 'Compresores', value: 'compresores'},
    {title: 'Construcción y Demolición', value: 'construccion-y-demolicion'},
    {title: 'Cortadoras de Césped', value: 'cortadoras-de-cesped'},
    {title: 'Equipos de Limpieza', value: 'equipos-de-limpieza'},
    {title: 'Lijadoras y Cepillos', value: 'lijadoras-y-cepillos'},
    {title: 'Sierras Eléctricas', value: 'sierras-electricas'},
    {title: 'Taladros y Atornilladores', value: 'taladros-y-atornilladores'},
  ],
  'herramientas-manuales': [
    {title: 'Abrazadoras', value: 'abrazadoras'},
    {title: 'Alicates y Prensas', value: 'alicates-y-prensas'},
    {title: 'Bloqueo del Volante', value: 'bloqueo-del-volante'},
    {title: 'Bombas de Pie', value: 'bombas-de-pie'},
    {title: 'Brocas para Metal', value: 'brocas-metal'},
    {title: 'Cierrapuertas', value: 'cierrapuertas'},
    {title: 'Cinceles', value: 'cinceles'},
    {title: 'Cortador de Mayólica', value: 'cortadormayolica'},
    {title: 'Hacha', value: 'hacha'},
  ],
  'seguridad-e-iluminacion': [
    {title: 'Iluminación de Trabajo', value: 'iluminacion-de-trabajo'},
    {title: 'Material de Seguridad', value: 'material-de-seguridad'},
  ],
};

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
        return value ? true : 'Selecciona una subcategoría.';
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
      title: 'Categoría principal',
      type: 'string',
      options: {list: ROOT_CATEGORIES, layout: 'dropdown'},
      validation: (r) => r.required(),
    }),
    subcategoryField('accesorios-de-herramientas', 'subcategoryAccesorios', 'Subcategoría'),
    subcategoryField('equipos-de-taller-y-construccion', 'subcategoryConstruccion', 'Subcategoría'),
    subcategoryField('herramientas-electricas', 'subcategoryElectricas', 'Subcategoría'),
    subcategoryField('herramientas-manuales', 'subcategoryManuales', 'Subcategoría'),
    subcategoryField('seguridad-e-iluminacion', 'subcategorySeguridad', 'Subcategoría'),
    defineField({name: 'shortDescription', title: 'Descripción corta', type: 'text', rows: 3}),
    defineField({
      name: 'description',
      title: 'Descripción completa',
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
      title: 'Imágenes',
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
        subtitle: `${subtitle || 'Sin SKU'} · ${subcategory || 'Sin categoría'} · ${
          typeof stock === 'number' && stock > 0 ? 'Stock disponible' : 'Sin stock'
        }`,
        media,
      };
    },
  },
});
