import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const siteUrl = process.env.VITE_SITE_URL?.trim()

if (!siteUrl) {
  console.info('VITE_SITE_URL is not set; skipping sitemap.xml. Set it for the production build.')
  process.exit(0)
}

let origin
try {
  const parsed = new URL(siteUrl)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('expected an http(s) origin without a path, query, or fragment')
  }
  origin = parsed.origin
} catch {
  console.error('VITE_SITE_URL must be an http(s) origin, such as https://example.com')
  process.exit(1)
}

const publicPaths = ['/', '/customer/listings']
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...publicPaths.map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`),
  '</urlset>',
  '',
].join('\n')

await Promise.all([
  writeFile(resolve('dist/sitemap.xml'), sitemap),
  writeFile(resolve('dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`),
])
