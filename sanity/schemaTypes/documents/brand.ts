import {defineField, defineType} from 'sanity';
import {normalizeBrandSlug} from '../brandCanonical';

export const brandType = defineType({
  name: 'brand',
  title: 'Marca',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (r) =>
        r.required().custom(async (value, context) => {
          const name = String(value || '').trim();
          if (!name) return true;

          const client = context.getClient({apiVersion: '2025-01-01'});
          const rawId = String((context.document as {_id?: string} | undefined)?._id || '');
          const publishedId = rawId.replace(/^drafts\./, '');
          const duplicateCount = await client.fetch<number>(
            `count(*[_type == "brand" && lower(name) == lower($name) && !(_id in [$draftId, $publishedId])])`,
            {name, draftId: `drafts.${publishedId}`, publishedId},
          );

          return duplicateCount === 0 || 'Ya existe otra marca con este nombre.';
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (r) =>
        r.required().custom(async (value, context) => {
          const current = typeof value === 'object' && value && 'current' in value ? String(value.current || '').trim() : '';
          if (!current) return true;

          const normalizedSlug = normalizeBrandSlug(current);
          if (current !== normalizedSlug) {
            return `Usa el slug canonico "${normalizedSlug}".`;
          }

          const client = context.getClient({apiVersion: '2025-01-01'});
          const rawId = String((context.document as {_id?: string} | undefined)?._id || '');
          const publishedId = rawId.replace(/^drafts\./, '');
          const duplicateCount = await client.fetch<number>(
            `count(*[_type == "brand" && slug.current == $slug && !(_id in [$draftId, $publishedId])])`,
            {slug: normalizedSlug, draftId: `drafts.${publishedId}`, publishedId},
          );

          return duplicateCount === 0 || 'Ya existe otra marca con este slug.';
        }),
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
