import {defineConfig} from 'sanity';
import {deskTool, type StructureResolver} from 'sanity/desk';
import {visionTool} from '@sanity/vision';
import {schemaTypes} from './sanity/schemaTypes';

const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

const singletonTypes = new Set(['homePage', 'siteSettings']);

const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenido')
    .items([
      S.listItem()
        .title('Inicio')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.listItem()
        .title('Ajustes del sitio')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.documentTypeListItem('product').title('Productos'),
      S.documentTypeListItem('brand').title('Marcas'),
    ]);

export default defineConfig({
  name: 'default',
  title: 'Luedma Admin',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [deskTool({structure}), visionTool()],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({schemaType}) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (prev, context) =>
      singletonTypes.has(context.schemaType)
        ? prev.filter(({action}) => action && singletonActions.has(action))
        : prev,
  },
});
