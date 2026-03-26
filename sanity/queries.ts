import { sanityClient } from './client'

export interface ProjectItem {
  _id: string
  titleCs: string | null
  titleEn: string | null
  year: number
  slug: string
  coverUrl: string | null
}

const PROJECTS_QUERY = `*[_type == "project"] | order(year desc) {
  _id,
  "titleCs": title[language == "cs"][0].value,
  "titleEn": title[language == "en"][0].value,
  year,
  "slug": slug.current,
  "coverUrl": cover.asset->url
}`

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    // Append Sanity image transform for smaller size
    const smallUrl = url + '?w=512&q=80&fm=jpg'
    const res = await fetch(smallUrl)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export async function getProjects(): Promise<ProjectItem[]> {
  const projects = await sanityClient.fetch(PROJECTS_QUERY)
  // Fetch cover images server-side and convert to data URLs
  const withCovers = await Promise.all(
    projects.map(async (p: any) => ({
      ...p,
      coverUrl: p.coverUrl ? await fetchImageAsDataUrl(p.coverUrl) : null,
    }))
  )
  return withCovers
}
