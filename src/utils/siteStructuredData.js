import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '../config/seo'

/** Google 검색 결과 사이트명(WebSite name)용 JSON-LD */
export function buildSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: ['수상한렌탈'],
        description: SITE_DESCRIPTION,
        inLanguage: 'ko-KR',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
        sameAs: ['https://www.instagram.com/susang_rental'],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        image: `${SITE_URL}/og-image.jpg`,
        telephone: '+82-10-4139-9844',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '잔다리로3길 7',
          addressLocality: '마포구',
          addressRegion: '서울특별시',
          addressCountry: 'KR',
        },
        parentOrganization: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export function upsertSiteStructuredData() {
  if (typeof document === 'undefined') return
  const payload = buildSiteStructuredData()
  const id = 'susang-site-structured-data'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(payload)
}
