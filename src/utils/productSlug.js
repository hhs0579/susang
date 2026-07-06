const COPY_PREFIX_RE = /^(copy-of-|복제[-_\s]*)/iu
const LEGACY_PRODUCT_ID_RE = /^copy-of-/i

export const PRODUCT_CATEGORY_KEYS = [
  'set',
  'camera',
  'lens',
  'support',
  'grip',
  'monitor',
  'light',
  'intercom',
]

export function isLegacyProductDocId(id) {
  return LEGACY_PRODUCT_ID_RE.test(String(id || '').trim())
}

export function slugifyProductName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function slugifyLegacyProductId(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(COPY_PREFIX_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

export function resolveProductSlug(raw = {}, fallbackId = '') {
  const stored = String(raw.slug || '').trim().toLowerCase()
  if (stored) return stored

  const fromName = slugifyProductName(raw.name)
  if (fromName) return fromName

  const id = String(fallbackId || raw.id || '').trim().toLowerCase()
  if (!id) return ''
  if (isLegacyProductDocId(id) || COPY_PREFIX_RE.test(id)) {
    return slugifyLegacyProductId(id) || id
  }
  return id
}

export function productDetailPath(categoryKey, product) {
  const category = String(categoryKey || product?.category || '').trim().toLowerCase()
  const slug = resolveProductSlug(product || {}, product?.id)
  if (!category || !slug) return '/'
  return `/${category}/${slug}`
}
