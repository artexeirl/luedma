import {createClient} from '@sanity/client';
import {getServerEnv} from './server-env';

const projectId = getServerEnv('PUBLIC_SANITY_PROJECT_ID');
const dataset = getServerEnv('PUBLIC_SANITY_DATASET') || 'production';
const apiVersion = getServerEnv('PUBLIC_SANITY_API_VERSION') || '2025-01-01';
const token = getServerEnv('SANITY_WRITE_TOKEN');

export const hasSanityWriteConfig = Boolean(projectId && dataset && token);

export const sanityAdminClient = createClient({
  projectId: projectId || 'missing-project-id',
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'published',
});
