import {defineField, defineType} from 'sanity';

export const brandType = defineType({
  name: 'brand',
  title: 'Marca',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Nombre', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Texto alternativo', type: 'string'})],
      validation: (r) => r.required(),
    }),
    defineField({name: 'summary', title: 'Resumen', type: 'text', rows: 2}),
    defineField({name: 'order', title: 'Orden', type: 'number', initialValue: 100}),
    defineField({name: 'isFeatured', title: 'Marca destacada', type: 'boolean', initialValue: false}),
    defineField({name: 'isVisible', title: 'Visible', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {title: 'name', media: 'logo', subtitle: 'slug.current'},
  },
});
