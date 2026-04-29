import {defineField, defineType} from 'sanity';

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Título SEO', type: 'string'}),
    defineField({name: 'description', title: 'Descripción SEO', type: 'text', rows: 3}),
    defineField({
      name: 'ogImage',
      title: 'Imagen Open Graph',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Texto alternativo', type: 'string'}),
      ],
    }),
  ],
});
