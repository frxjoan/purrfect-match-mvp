import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const siteName = 'Purrfect Match'
const siteOrigin = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

function setMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(path) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!path) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = new URL(path, `${siteOrigin}/`).href
}

function absoluteImage(image) {
  if (!image) return ''
  try {
    const url = new URL(image, `${siteOrigin}/`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function applySeo({ title, description, path, image, robots = 'index,follow' }) {
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const canonical = path && robots === 'index,follow' ? new URL(path, `${siteOrigin}/`).href : ''
  document.title = fullTitle
  document.documentElement.lang = 'en'
  setMeta('name', 'description', description)
  setMeta('name', 'robots', robots)
  setCanonical(canonical)
  setMeta('property', 'og:type', canonical ? 'website' : '')
  setMeta('property', 'og:site_name', canonical ? siteName : '')
  setMeta('property', 'og:title', canonical ? fullTitle : '')
  setMeta('property', 'og:description', canonical ? description : '')
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:image', canonical ? absoluteImage(image) : '')
}

export function RouteSeo() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const titles = {
      '/login': 'Sign in',
      '/register': 'Create account',
      '/unauthorized': 'Access denied',
    }
    applySeo({ title: titles[pathname] || 'Page', description: '', robots: 'noindex,nofollow' })
  }, [pathname])

  return null
}

function Seo({ title, description, image, robots = 'index,follow' }) {
  const { pathname } = useLocation()

  useEffect(() => {
    applySeo({ title, description, path: pathname, image, robots })
    return () => applySeo({ title: 'Page', description: '', robots: 'noindex,nofollow' })
  }, [title, description, pathname, image, robots])

  return null
}

export default Seo
