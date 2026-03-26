import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: '61w2dclt',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
