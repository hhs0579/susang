/** 관리자 실수·복제 시 붙는 「복제-」「복제 」 접두어 제거 */
const COPY_PREFIX_RE = /^복제[-_\s]*/iu

export function sanitizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(COPY_PREFIX_RE, '')
    .trim()
}

export function sanitizeCategoryLabel(value) {
  const key = sanitizeCategoryKey(value)
  return key ? key.toUpperCase() : ''
}

export function isCopyPrefixedCategory(value) {
  return COPY_PREFIX_RE.test(String(value || '').trim())
}

/** taxonomy 배열: 접두어 제거 + 중복 제거, 비면 null */
export function sanitizeTaxonomyCategories(categories) {
  if (!Array.isArray(categories)) return null
  const out = []
  const seen = new Set()
  for (const raw of categories) {
    const key = sanitizeCategoryKey(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out.length ? out : null
}
