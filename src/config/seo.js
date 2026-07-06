export const SITE_URL = 'https://susangrental.com'
export const SITE_NAME = '수상한렌탈'
export const SITE_TITLE = '수상한렌탈'
export const SITE_DESCRIPTION =
  '수상한렌탈은 카메라, 렌즈, 조명, 음향 등 영상 촬영 장비를 쉽고 빠르게 확인하고 렌탈할 수 있는 전문 장비 렌탈 플랫폼입니다.'
export const SITE_KEYWORDS =
  '수상한렌탈, 영상장비렌탈, 카메라렌탈, 렌즈렌탈, 조명렌탈, 촬영장비, 시네마장비, 합정렌탈'
export const OG_IMAGE_PATH = '/og-image.jpg'
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`

export const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/set', changefreq: 'weekly', priority: '0.9' },
  { path: '/camera', changefreq: 'weekly', priority: '0.9' },
  { path: '/lens', changefreq: 'weekly', priority: '0.9' },
  { path: '/support', changefreq: 'weekly', priority: '0.8' },
  { path: '/grip', changefreq: 'weekly', priority: '0.8' },
  { path: '/monitor', changefreq: 'weekly', priority: '0.8' },
  { path: '/light', changefreq: 'weekly', priority: '0.8' },
  { path: '/intercom', changefreq: 'weekly', priority: '0.8' },
  { path: '/guide', changefreq: 'monthly', priority: '0.7' },
  { path: '/discount', changefreq: 'monthly', priority: '0.7' },
]
