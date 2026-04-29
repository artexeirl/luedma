import {createClient} from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2025-01-01';

export const hasSanityConfig = Boolean(projectId && dataset);

export const sanityClient = createClient({
  projectId: projectId || 'missing-project-id',
  dataset,
  apiVersion,
  useCdn: false,
  token: import.meta.env.SANITY_READ_TOKEN,
  perspective: 'published',
});

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!hasSanityConfig) return null;
  return sanityClient.fetch<T>(query, params);
}
