import {createClient} from '@sanity/client';

const API_VERSION = '2025-01-01';
const ROOT_SLUG = 'herramientas-electricas';
const SUBCATEGORY_FIELD = 'subcategoryElectricas';
const ROOT_CATEGORY_NAME = 'Herramientas Electricas';

const DESIRED_SUBCATEGORIES = [
  {slug: 'amoladoras-y-esmeriles', name: 'Amoladoras y Esmeriles', order: 10},
  {slug: 'baterias-y-cargadores', name: 'Baterias y Cargadores', order: 20},
  {slug: 'lijadoras-y-cepillos', name: 'Lijadoras y Cepillos', order: 30},
  {slug: 'pistolas-de-calor', name: 'Pistolas de Calor', order: 40},
  {slug: 'rotomartillos-y-demolicion', name: 'Rotomartillos y Demolicion', order: 50},
  {slug: 'ruteadoras-fresadoras-rebajadoras', name: 'Ruteadoras, Fresadoras, Rebajadoras', order: 60},
  {slug: 'sierras-y-tronzadoras', name: 'Sierras y Tronzadoras', order: 70},
  {slug: 'sopladoras-y-aspiradoras', name: 'Sopladoras y Aspiradoras', order: 80},
  {slug: 'taladros-y-atornilladores', name: 'Taladros y Atornilladores', order: 90},
];

const LEGACY_SLUG_MAP = {
  'amoladoras-y-pulidoras': 'amoladoras-y-esmeriles',
  'construccion-y-demolicion': 'rotomartillos-y-demolicion',
  'equipos-de-limpieza': 'sopladoras-y-aspiradoras',
  'sierras-electricas': 'sierras-y-tronzadoras',
  'bomba-agua': null,
  compresores: null,
  'cortadoras-de-cesped': null,
};

async function migrateCategories(client) {
  const categories = await client.fetch(
    `*[_type == "category" && (slug.current == $rootSlug || parent->slug.current == $rootSlug)]{
      _id,
      name,
      "slug": slug.current,
      "parentId": parent->_id,
      "parentSlug": parent->slug.current,
      isVisible
    }`,
    {rootSlug: ROOT_SLUG},
  );

  let rootCategory = categories.find((item) => item.slug === ROOT_SLUG);
  const tx = client.transaction();

  if (!rootCategory) {
    rootCategory = {
      _id: `category.${ROOT_SLUG}`,
      slug: ROOT_SLUG,
    };
    tx.createIfNotExists({
      _id: rootCategory._id,
      _type: 'category',
      name: ROOT_CATEGORY_NAME,
      slug: {_type: 'slug', current: ROOT_SLUG},
      order: 10,
      isVisible: true,
      summary: 'Taladros, amoladoras y equipos electricos para uso profesional.',
    });
  } else {
    tx.patch(rootCategory._id, {
      set: {
        name: ROOT_CATEGORY_NAME,
        slug: {_type: 'slug', current: ROOT_SLUG},
        order: 10,
        isVisible: true,
      },
    });
  }

  const bySlug = new Map(categories.map((item) => [item.slug, item]));

  DESIRED_SUBCATEGORIES.forEach((subcategory) => {
    const current = bySlug.get(subcategory.slug);
    const legacy = Object.entries(LEGACY_SLUG_MAP).find(([, nextSlug]) => nextSlug === subcategory.slug)?.[0];
    const legacyDoc = legacy ? bySlug.get(legacy) : null;
    const target = current || legacyDoc;

    if (target) {
      tx.patch(target._id, {
        set: {
          name: subcategory.name,
          slug: {_type: 'slug', current: subcategory.slug},
          order: subcategory.order,
          isVisible: true,
          parent: {_type: 'reference', _ref: rootCategory._id},
        },
      });
      bySlug.set(subcategory.slug, {...target, slug: subcategory.slug});
      return;
    }

    tx.create({
      _id: `category.${subcategory.slug}`,
      _type: 'category',
      name: subcategory.name,
      slug: {_type: 'slug', current: subcategory.slug},
      parent: {_type: 'reference', _ref: rootCategory._id},
      order: subcategory.order,
      isVisible: true,
    });
  });

  Object.entries(LEGACY_SLUG_MAP)
    .filter(([, nextSlug]) => nextSlug === null)
    .forEach(([legacySlug]) => {
      const legacyDoc = bySlug.get(legacySlug);
      if (!legacyDoc) return;
      tx.patch(legacyDoc._id, {
        set: {
          isVisible: false,
          order: 999,
        },
      });
    });

  await tx.commit();
}

async function migrateProducts(client) {
  const products = await client.fetch(
    `*[_type == "product" && categoryRoot == $rootSlug]{
      _id,
      name,
      categoryRoot,
      ${SUBCATEGORY_FIELD}
    }`,
    {rootSlug: ROOT_SLUG},
  );

  const tx = client.transaction();
  const manualReview = [];

  products.forEach((product) => {
    const currentSubcategory = product[SUBCATEGORY_FIELD];
    if (!currentSubcategory || !(currentSubcategory in LEGACY_SLUG_MAP)) return;

    const nextSlug = LEGACY_SLUG_MAP[currentSubcategory];
    if (nextSlug) {
      tx.patch(product._id, {set: {[SUBCATEGORY_FIELD]: nextSlug}});
      return;
    }

    tx.patch(product._id, {unset: [SUBCATEGORY_FIELD]});
    manualReview.push(`${product._id} :: ${product.name} :: ${currentSubcategory}`);
  });

  await tx.commit();

  if (manualReview.length > 0) {
    console.log('Productos que quedaron sin subcategoria electrica y requieren revision manual:');
    manualReview.forEach((line) => console.log(`- ${line}`));
  }
}

async function run() {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN;

  if (!projectId || !token) {
    throw new Error('Faltan PUBLIC_SANITY_PROJECT_ID/SANITY_STUDIO_PROJECT_ID o un token de Sanity para ejecutar la migracion.');
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    perspective: 'published',
  });

  await migrateCategories(client);
  await migrateProducts(client);
  console.log('Migracion de categorias electricas completada.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
