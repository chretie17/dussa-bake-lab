import { useEffect } from 'react'

function setMeta(selector, attr, value) {
  if (!value) return
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || []
    if (!name) return
    tag.setAttribute(selector.includes('property=') ? 'property' : 'name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute(attr, value)
}

/**
 * Keeps the document title and social meta in step with the current route.
 * A tiny stand-in for react-helmet — enough for a single-page marketing site.
 */
export default function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      setMeta('meta[name="description"]', 'content', description)
      setMeta('meta[property="og:description"]', 'content', description)
      setMeta('meta[name="twitter:description"]', 'content', description)
    }
    if (title) {
      setMeta('meta[property="og:title"]', 'content', title)
      setMeta('meta[name="twitter:title"]', 'content', title)
    }
  }, [title, description])
}
