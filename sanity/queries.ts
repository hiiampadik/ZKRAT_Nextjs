import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from './client'

const builder = imageUrlBuilder(sanityClient)

export interface AboutContent {
  textCs: Array<{ _key: string; children: Array<{ text: string }> }>
  textEn: Array<{ _key: string; children: Array<{ text: string }> }>
}

export interface RichTextBlock {
  _key: string
  _type: string
  style?: string
  children: Array<{ _key: string; _type: string; text: string; marks?: string[] }>
  markDefs?: Array<{ _key: string; _type: string; href?: string }>
}

export interface ProjectItem {
  _id: string
  titleCs: string | null
  titleEn: string | null
  year: number
  slug: string | null
  coverUrl: string | null
  descriptionCs: RichTextBlock[] | null
  descriptionEn: RichTextBlock[] | null
  client: { name?: string; url?: string } | null
  team: Array<{ name: string; external?: boolean; _key: string }> | null
  tags: Array<{ _id: string; titleCs: string | null; titleEn: string | null }> | null
  videos: string[] | null
  gallery: any[] | null
}

const PROJECTS_QUERY = `*[_type == "project"] | order(year desc) {
  _id,
  "titleCs": title[language == "cs"][0].value,
  "titleEn": title[language == "en"][0].value,
  year,
  "slug": slug.current,
  cover,
  "descriptionCs": description.cs,
  "descriptionEn": description.en,
  client,
  team,
  "tags": tags[]->{
    _id,
    "titleCs": title[language == "cs"][0].value,
    "titleEn": title[language == "en"][0].value
  },
  videos,
  gallery
}`

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

const ABOUT_QUERY = `*[_type == "about"][0] {
  "textCs": text.cs,
  "textEn": text.en
}`

export async function getAbout(): Promise<AboutContent | null> {
  return await sanityClient.fetch(ABOUT_QUERY)
}

export async function getProjects(): Promise<ProjectItem[]> {
  const projects = await sanityClient.fetch(PROJECTS_QUERY)
  const withMedia = await Promise.all(
    projects.map(async (p: any) => {
      const coverUrl = p.cover
        ? builder.image(p.cover).width(512).quality(60).format('jpg').url()
        : null

      const { cover, ...rest } = p
      return {
        ...rest,
        coverUrl: coverUrl ? await fetchImageAsDataUrl(coverUrl) : null,
      }
    })
  )
  return withMedia
}
