import {defineArrayMember, defineField, defineType} from 'sanity';

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Ajustes del Sitio',
  type: 'document',
  fields: [
    defineField({name: 'siteName', title: 'Nombre del sitio', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'metaTitle', title: 'Título Meta global', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Descripción Meta global', type: 'text', rows: 3}),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Texto alternativo', type: 'string', validation: (r) => r.required()})],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'phones',
      title: 'Teléfonos',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (r) => r.min(1),
    }),
    defineField({name: 'email', title: 'Correo', type: 'string'}),
    defineField({name: 'address', title: 'Dirección', type: 'string'}),
    defineField({
      name: 'socialLinks',
      title: 'Redes sociales',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'network', title: 'Red', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'url', title: 'URL', type: 'string', validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'network', subtitle: 'url'}},
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Ajustes del sitio'};
    },
  },
});
