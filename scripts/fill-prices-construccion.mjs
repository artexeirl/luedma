import {getCliClient} from 'sanity/cli';

const TARGET_CATEGORY = process.argv.find((arg) => arg.startsWith('--category='))?.split('=')[1] || 'equipos-de-taller';

const BASE_BY_KEYWORD = [
  {test: /winch|malacate|tecle/i, price: 1890},
  {test: /hidrolic|hidraul|gato/i, price: 520},
  {test: /elevador|levantamiento|grua|grúa/i, price: 1490},
  {test: /compresor/i, price: 1290},
  {test: /soldadora|inverter/i, price: 980},
  {test: /escalera/i, price: 420},
  {test: /carretilla|plataforma/i, price: 680},
  {test: /medidor|multimetro|multímetro|laser|láser|nivel/i, price: 390},
  {test: /organizador|caja|almacen|almacén|gabinete|mochila/i, price: 260},
  {test: /bomba/i, price: 940},
];

const BRAND_FACTOR = {
  bosch: 1.35,
  hilti: 1.6,
  milwaukee: 1.45,
  makita: 1.4,
  karcher: 1.25,
  stanley: 1.15,
  total: 0.95,
  ronix: 0.9,
  makute: 0.85,
  truper: 0.95,
  dewalt: 1.35,
  'de-walt': 1.35,
};

function pickBasePrice(name) {
  for (const rule of BASE_BY_KEYWORD) {
    if (rule.test.test(name)) return rule.price;
  }
  return 790;
}

function stableOffsetFromSlug(slug) {
  let acc = 0;
  for (let i = 0; i < slug.length; i += 1) acc = (acc + slug.charCodeAt(i) * (i + 1)) % 1000;
  return ((acc % 17) - 8) / 100;
}

function roundToNine(n) {
  const floor = Math.floor(n);
  return Number((floor + 0.9).toFixed(2));
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const client = getCliClient({apiVersion: '2025-01-01'}).withConfig({useCdn: false});

  const products = await client.fetch(
    `*[_type == "product" && categoryRoot == $category]{
      _id,
      name,
      "slug": slug.current,
      price,
      "brandSlug": brand->slug.current
    }`,
    {category: TARGET_CATEGORY},
  );

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    if (!p?.slug || !p?.name) {
      skipped += 1;
      continue;
    }

    const current = typeof p.price === 'number' ? p.price : 0;
    if (current > 0.01) {
      skipped += 1;
      continue;
    }

    const base = pickBasePrice(p.name);
    const factor = BRAND_FACTOR[p.brandSlug] || 1;
    const offset = stableOffsetFromSlug(p.slug);
    const candidate = base * factor * (1 + offset);
    const finalPrice = roundToNine(Math.max(89, candidate));
    const compareAtPrice = roundToNine(finalPrice * 1.16);

    if (!dryRun) {
      await client
        .patch(p._id)
        .set({
          price: finalPrice,
          compareAtPrice,
        })
        .commit();
    }

    updated += 1;
  }

  console.log(`Categoria: ${TARGET_CATEGORY}`);
  console.log(`Total analizados: ${products.length}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Omitidos: ${skipped}`);
  console.log(dryRun ? 'Modo: dry-run' : 'Modo: write');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
