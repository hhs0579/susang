import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TITLE, OG_IMAGE_URL } from '../config/seo'
import { upsertSiteStructuredData } from './siteStructuredData'

const ROUTE_SEO = {
  home: { title: SITE_TITLE, path: '/' },
  'set-list': { title: `SET 렌탈 | ${SITE_NAME}`, path: '/set' },
  'camera-list': { title: `카메라 렌탈 | ${SITE_NAME}`, path: '/camera' },
  'lens-list': { title: `렌즈·매트 렌탈 | ${SITE_NAME}`, path: '/lens' },
  'support-list': { title: `서포트 장비 렌탈 | ${SITE_NAME}`, path: '/support' },
  'grip-list': { title: `그립·짐벌 렌탈 | ${SITE_NAME}`, path: '/grip' },
  'monitor-list': { title: `모니터 렌탈 | ${SITE_NAME}`, path: '/monitor' },
  'light-list': { title: `조명 렌탈 | ${SITE_NAME}`, path: '/light' },
  'intercom-list': { title: `인터컴 렌탈 | ${SITE_NAME}`, path: '/intercom' },
  guide: { title: `이용안내 | ${SITE_NAME}`, path: '/guide' },
  discount: { title: `할인정보 | ${SITE_NAME}`, path: '/discount' },
}

function upsertMeta(attr, key, content) {
  if (!content || typeof document === 'undefined') return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  if (typeof document === 'undefined') return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const CATEGORY_LIST_SEO = {
  set: { title: `SET 렌탈 | ${SITE_NAME}`, path: '/set' },
  camera: { title: `카메라 렌탈 | ${SITE_NAME}`, path: '/camera' },
  lens: { title: `렌즈·매트 렌탈 | ${SITE_NAME}`, path: '/lens' },
  support: { title: `서포트 장비 렌탈 | ${SITE_NAME}`, path: '/support' },
  grip: { title: `그립·짐벌 렌탈 | ${SITE_NAME}`, path: '/grip' },
  monitor: { title: `모니터 렌탈 | ${SITE_NAME}`, path: '/monitor' },
  light: { title: `조명 렌탈 | ${SITE_NAME}`, path: '/light' },
  intercom: { title: `인터컴 렌탈 | ${SITE_NAME}`, path: '/intercom' },
}

function applySeoMeta({ title, description, canonicalPath, imageUrl = OG_IMAGE_URL, ogTitle }) {
  if (typeof document === 'undefined') return
  const canonical = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '') || '/'}`

  document.title = title
  upsertCanonical(canonical)
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'ko_KR')
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:title', ogTitle || title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:image', imageUrl)
  upsertMeta('property', 'og:image:secure_url', imageUrl)
  upsertMeta('property', 'og:image:type', 'image/jpeg')
  upsertMeta('property', 'og:image:width', '1200')
  upsertMeta('property', 'og:image:height', '630')
  upsertMeta('property', 'og:image:alt', SITE_NAME)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', imageUrl)
}

export function applyRouteSeo(route) {
  if (typeof document === 'undefined') return
  if (String(route.path || '').startsWith('/admin')) return

  const preset = ROUTE_SEO[route.name]
  const path = preset?.path || route.path
  const title = preset?.title || SITE_TITLE

  const isHome = route.name === 'home'
  applySeoMeta({
    title,
    description: SITE_DESCRIPTION,
    canonicalPath: path,
    ...(isHome ? { ogTitle: SITE_NAME } : {}),
  })

  if (isHome) {
    upsertSiteStructuredData()
    upsertMeta('property', 'og:site_name', SITE_NAME)
  }
}

export function applyCategoryListSeo(categoryKey) {
  const key = String(categoryKey || '').trim().toLowerCase()
  const preset = CATEGORY_LIST_SEO[key]
  if (!preset) return
  applySeoMeta({
    title: preset.title,
    description: SITE_DESCRIPTION,
    canonicalPath: preset.path,
  })
}

export function applyProductDetailSeo(categoryKey, product, canonicalPath) {
  const name = String(product?.name || '').trim()
  const brand = String(product?.brand || '').trim()
  const label = [brand, name].filter(Boolean).join(' ')
  const categoryLabel = String(categoryKey || '').trim().toUpperCase()
  const title = label ? `${label} | ${SITE_NAME}` : SITE_TITLE
  const description =
    String(product?.priceDisplayText || '').trim() ||
    (label ? `${label} · ${categoryLabel} 렌탈 · ${SITE_NAME}` : SITE_DESCRIPTION)
  const image = String(product?.image || product?.thumbnail || '').trim() || OG_IMAGE_URL

  applySeoMeta({
    title,
    description,
    canonicalPath: canonicalPath || `/${categoryKey}`,
    imageUrl: image.startsWith('http') ? image : OG_IMAGE_URL,
  })
}
