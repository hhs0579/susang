import { reactive } from 'vue'

const CONTENT_STORAGE_KEY = 'susang_site_content_v1'

const defaultCategoryItems = [
  {
    id: 1,
    name: 'SET',
    desc: '촬영 세트',
    imageUrl: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA MINI FULL SET.jpg',
  },
  {
    id: 2,
    name: 'CAMERA',
    desc: '시네마 카메라',
    imageUrl: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA 35 FULL SET.jpg',
  },
  {
    id: 3,
    name: 'LENS',
    desc: '시네 렌즈',
    imageUrl: '/assets/images/homepage_img/02_Lens,Matte/01_Lens/ARLES PRIME LENS SET.png',
  },
  {
    id: 4,
    name: 'SUPPORT',
    desc: 'Wireless Focus, MatteBox, Filter',
    imageUrl: '/assets/images/homepage_img/02_Lens,Matte/01_Lens/ARLES PRIME LENS SET.png',
  },
  {
    id: 5,
    name: 'GRIP',
    desc: '리그/그립',
    imageUrl: '/assets/images/homepage_img/03_Grip,Gimbal/02_Gimbal/RONIN 2.jpg',
  },
  {
    id: 6,
    name: 'MONITOR',
    desc: '모니터링 장비',
    imageUrl: '/assets/images/homepage_img/04_Monitor,Wireless/01_Wireless Monitor/TERADEK Bolt 6 LT.jpg',
  },
  {
    id: 7,
    name: 'LIGHT',
    desc: '조명 장비',
    imageUrl: '/assets/images/homepage_img/05_Light/01_LED Panel/Nova P600C.jpg',
  },
  {
    id: 8,
    name: 'INTERCOM',
    desc: '인터컴 장비',
    imageUrl: '/assets/images/homepage_img/06_Intercom/SOLIDCOM SE.jpg',
  },
]

const defaultContent = {
  heroBannerImageUrl: '/assets/images/main1.png',
  categoryItems: defaultCategoryItems,
  taxonomyCategories: ['set', 'camera', 'lens', 'support', 'grip', 'monitor', 'light', 'intercom'],
  taxonomySectionsByCategory: {
    set: ['SET'],
    camera: ['CAMERA'],
    lens: ['PRIME LENS', 'ZOOM LENS', 'E MOUNT', 'RF MOUNT', 'ADAPTER'],
    support: ['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'],
    grip: ['GIMBAL', 'GRIP', 'TRIPOD', 'CART'],
    monitor: ['WIRELESS TRANSCEIVER', "5' 7' MONITOR", 'DIRECTOR MONITOR', 'MONITOR ACC'],
    light: [
      'LED PANEL',
      'LED SPOT-SOURCE',
      'LED MODIFIERS',
      'LED LIKE PRACTICAL',
      'LIGHT ARM SET',
      'LIGHT GRIP',
      'BATTERY SYSTEM',
      'LIGHT SCRIM',
    ],
    intercom: ['INTERCOM'],
  },
  arrivalItems: [
    { id: 1, title: 'ARRI ALEXA MINI FULL SET', price: '₩300,000', imageUrl: '' },
    { id: 2, title: 'Canon C500 Mark II', price: '₩200,000', imageUrl: '' },
    { id: 3, title: 'ARRI ALEXA 35', price: '₩350,000', imageUrl: '' },
  ],
}

function parseStoredContent() {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function mergeCategoryItems(storedItems = []) {
  const storedMap = new Map(storedItems.map((item) => [item.name, item]))

  return defaultCategoryItems.map((item) => {
    const stored = storedMap.get(item.name)
    if (!stored) return { ...item }
    return {
      ...item,
      desc: stored.desc || item.desc,
      imageUrl: stored.imageUrl || item.imageUrl,
    }
  })
}

function getInitialContent() {
  const stored = parseStoredContent()
  if (!stored) return defaultContent

  return {
    heroBannerImageUrl: stored.heroBannerImageUrl || defaultContent.heroBannerImageUrl,
    categoryItems: mergeCategoryItems(stored.categoryItems || []),
    taxonomyCategories:
      Array.isArray(stored.taxonomyCategories) && stored.taxonomyCategories.length
        ? stored.taxonomyCategories
        : defaultContent.taxonomyCategories,
    taxonomySectionsByCategory: {
      ...defaultContent.taxonomySectionsByCategory,
      ...(stored.taxonomySectionsByCategory || {}),
    },
    arrivalItems: Array.isArray(stored.arrivalItems) && stored.arrivalItems.length ? stored.arrivalItems : defaultContent.arrivalItems,
  }
}

const initial = getInitialContent()

const state = reactive({
  heroBannerImageUrl: initial.heroBannerImageUrl,
  categoryItems: [...initial.categoryItems],
  taxonomyCategories: [...initial.taxonomyCategories],
  taxonomySectionsByCategory: { ...initial.taxonomySectionsByCategory },
  arrivalItems: [...initial.arrivalItems],
})

function persist() {
  localStorage.setItem(
    CONTENT_STORAGE_KEY,
    JSON.stringify({
      heroBannerImageUrl: state.heroBannerImageUrl,
      categoryItems: state.categoryItems,
      taxonomyCategories: state.taxonomyCategories,
      taxonomySectionsByCategory: state.taxonomySectionsByCategory,
      arrivalItems: state.arrivalItems,
    }),
  )
}

function addArrivalItem(payload) {
  const nextId = state.arrivalItems.length
    ? Math.max(...state.arrivalItems.map((item) => item.id)) + 1
    : 1
  state.arrivalItems.unshift({ id: nextId, ...payload })
  persist()
}

function removeArrivalItem(id) {
  const index = state.arrivalItems.findIndex((item) => item.id === id)
  if (index >= 0) {
    state.arrivalItems.splice(index, 1)
    persist()
  }
}

function updateCategoryImage(id, imageUrl) {
  const item = state.categoryItems.find((entry) => entry.id === id)
  if (!item) return
  item.imageUrl = imageUrl
  persist()
}

function updateCategoryItems(items = []) {
  state.categoryItems = [...items]
  persist()
}

function saveTaxonomyConfig(categories = [], sectionsByCategory = {}) {
  const normalizedCategories = categories
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean)

  state.taxonomyCategories = normalizedCategories
  state.taxonomySectionsByCategory = { ...sectionsByCategory }

  const existingByName = new Map(state.categoryItems.map((item) => [item.name, item]))
  state.categoryItems = normalizedCategories.map((categoryKey, index) => {
    const name = categoryKey.toUpperCase()
    const existing = existingByName.get(name)
    return (
      existing || {
        id: Date.now() + index,
        name,
        desc: `${name} 카테고리`,
        imageUrl: '',
      }
    )
  })
  persist()
}

function updateHeroBannerImage(imageUrl) {
  state.heroBannerImageUrl = imageUrl || defaultContent.heroBannerImageUrl
  persist()
}

export function useContentStore() {
  return {
    state,
    addArrivalItem,
    removeArrivalItem,
    updateCategoryImage,
    updateCategoryItems,
    saveTaxonomyConfig,
    updateHeroBannerImage,
  }
}
