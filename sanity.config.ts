import {visionTool} from '@sanity/vision';
import {defineConfig} from 'sanity';
import {structureTool, type StructureResolver} from 'sanity/structure';
import {schemaTypes} from './sanity/schemaTypes';
import {ROOT_CATEGORIES, ROOT_TO_SUBCATEGORY_FIELD, SUBCATEGORY_OPTIONS} from './sanity/schemaTypes/productCategories';

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
      S.listItem()
        .title('Productos')
        .id('products-by-category-root')
        .child(
          S.list()
            .title('Productos por categoria')
            .items([
              S.listItem()
                .title('Todos los productos')
                .id('products-all')
                .child(
                  S.documentTypeList('product')
                    .title('Todos los productos')
                    .defaultOrdering([{field: 'name', direction: 'asc'}]),
                ),
              ...ROOT_CATEGORIES.map((category) => {
                const subcategoryField = ROOT_TO_SUBCATEGORY_FIELD[category.value];
                const subcategories = SUBCATEGORY_OPTIONS[category.value] || [];

                return S.listItem()
                  .title(category.title)
                  .id(`products-${category.value}`)
                  .child(
                    S.list()
                      .title(category.title)
                      .items([
                        S.listItem()
                          .title(`Todos en ${category.title}`)
                          .id(`products-${category.value}-all`)
                          .child(
                            S.documentList()
                              .title(category.title)
                              .schemaType('product')
                              .filter('_type == "product" && categoryRoot == $categoryRoot')
                              .params({categoryRoot: category.value})
                              .defaultOrdering([{field: 'name', direction: 'asc'}]),
                          ),
                        S.listItem()
                          .title('Sin subcategoria asignada')
                          .id(`products-${category.value}-no-subcategory`)
                          .child(
                            S.documentList()
                              .title(`${category.title} sin subcategoria`)
                              .schemaType('product')
                              .filter(`_type == "product" && categoryRoot == $categoryRoot && !defined(${subcategoryField})`)
                              .params({categoryRoot: category.value})
                              .defaultOrdering([{field: 'name', direction: 'asc'}]),
                          ),
                        ...subcategories.map((subcategory) =>
                          S.listItem()
                            .title(subcategory.title)
                            .id(`products-${category.value}-${subcategory.value}`)
                            .child(
                              S.documentList()
                                .title(`${category.title} / ${subcategory.title}`)
                                .schemaType('product')
                                .filter(`_type == "product" && categoryRoot == $categoryRoot && ${subcategoryField} == $subcategory`)
                                .params({categoryRoot: category.value, subcategory: subcategory.value})
                                .defaultOrdering([{field: 'name', direction: 'asc'}]),
                            ),
                        ),
                      ]),
                  );
              }),
              S.listItem()
                .title('Sin categoria principal')
                .id('products-uncategorized')
                .child(
                  S.documentList()
                    .title('Productos sin categoria principal')
                    .schemaType('product')
                    .filter('_type == "product" && !defined(categoryRoot)')
                    .defaultOrdering([{field: 'name', direction: 'asc'}]),
                ),
            ]),
        ),
      S.listItem()
        .title('Marcas')
        .id('brands')
        .child(
          S.documentTypeList('brand')
            .title('Marcas')
            .defaultOrdering([{field: 'name', direction: 'asc'}]),
        ),
    ]);

export default defineConfig({
  name: 'default',
  title: 'Luedma Admin',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({structure}), visionTool()],
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
