import {defineField, defineType} from 'sanity';

export const linkType = defineType({
  name: 'link',
  title: 'Enlace',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Texto', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'href', title: 'URL', type: 'string', validation: (r) => r.required()}),
  ],
});
