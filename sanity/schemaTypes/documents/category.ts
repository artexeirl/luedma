import {defineField, defineType} from 'sanity';

export const categoryType = defineType({
  name: 'category',
  title: 'Categoría',
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
      name: 'parent',
      title: 'Categoría padre',
      type: 'reference',
      to: [{type: 'category'}],
      options: {disableNew: true},
    }),
    defineField({name: 'summary', title: 'Resumen', type: 'text', rows: 3}),
    defineField({name: 'order', title: 'Orden', type: 'number', initialValue: 100}),
    defineField({name: 'isVisible', title: 'Visible', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'slug.current', parent: 'parent.name'},
    prepare({title, subtitle, parent}) {
      return {
        title,
        subtitle: parent ? `${parent} · ${subtitle}` : subtitle,
      };
    },
  },
});
