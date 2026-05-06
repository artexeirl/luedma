import {createClient} from '@sanity/client';

const API_VERSION = '2025-01-01';
const ROOT_SLUG = 'herramientas-electricas';
const SUBCATEGORY_FIELD = 'subcategoryElectricas';

const LEGACY_SLUG_MAP = {
  'amoladoras-y-pulidoras': 'amoladoras-y-esmeriles',
  'construccion-y-demolicion': 'rotomartillos-y-demolicion',
  'equipos-de-limpieza': 'sopladoras-y-aspiradoras',
  'sierras-electricas': 'sierras-y-tronzadoras',
  'bomba-agua': null,
  compresores: null,
  'cortadoras-de-cesped': null,
};

async function run() {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN;

  if (!projectId || !token) {
    throw new Error('Faltan variables de entorno de Sanity para ejecutar la migracion.');
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    perspective: 'published',
  });

  const products = await client.fetch(
    `*[_type == "product" && categoryRoot == $rootSlug && defined(${SUBCATEGORY_FIELD})]{
      _id,
      name,
      ${SUBCATEGORY_FIELD}
    }`,
    {rootSlug: ROOT_SLUG},
  );

  const tx = client.transaction();
  let mutated = 0;

  for (const product of products) {
    const current = product[SUBCATEGORY_FIELD];
    if (!(current in LEGACY_SLUG_MAP)) continue;

    const next = LEGACY_SLUG_MAP[current];
    if (next) {
      tx.patch(product._id, {set: {[SUBCATEGORY_FIELD]: next}});
    } else {
      tx.patch(product._id, {unset: [SUBCATEGORY_FIELD]});
    }
    mutated += 1;
  }

  if (mutated === 0) {
    console.log('No hubo productos por actualizar.');
    return;
  }

  await tx.commit();
  console.log(`Productos actualizados: ${mutated}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
