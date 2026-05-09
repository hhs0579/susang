import { reactive } from 'vue'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const CONTENT_STORAGE_KEY = 'susang_site_content_v1'
const SITE_SETTINGS_COLLECTION = 'siteSettings'
const HERO_BANNER_DOC_ID = 'hero'

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
  contentUpdatedAt: 0,
  heroBannerImageUrl: '/assets/images/main1.png',
  heroBannerImages: ['/assets/images/main1.png'],
  heroBannerImagesMobile: [],
  heroBannerTitle: '감독이 운영하는 감독을 위한 렌탈',
  heroBannerDescriptionLines: [
    '수상한렌탈은 수상한움직임 프로덕션 소속 렌탈샵입니다.',
    '촬영감독이 운영하며 감독님들께 저렴하고',
    '실속 있는 장비 세팅으로 찾아뵙겠습니다.',
  ],
  guideInfoCardTexts: [
    {
      title: '예약\n및 대여 시간',
      body: '평일: 09:00 - 19:00\n주말: 10:00 - 18:00\n공휴일: 휴무\n대여/반납 시간은 사전 협의 가능',
    },
    {
      title: '대여\n장소',
      body: '서울시 마포구 잔다리로3길 7 1층\n수상한렌탈 본사\n지하철 2호선 합정역 2번 출구 도보 6분\n주차 가능 (사전 문의 필요)',
    },
    {
      title: '결제\n방법',
      body: '현금 / 계좌이체\n신용카드 / 체크카드\n세금계산서 발행 가능\n보증금은 현금 또는 카드 결제',
    },
    {
      title: '예약\n문의',
      body: '카카오톡 채널: http://pf.kakao.com/_xbxcxhhK\n전화: 010-4139-9844\n이메일: susanghanrental@gmail.com',
      footer: '7:00 am - 11:00 pm 상담 가능',
    },
  ],
  guideSteps: [
    {
      step: '01',
      title: 'How to use',
      subtitle: 'Kakao',
      body:
        '현재 저희는 카카오톡 채널로 예약을 받고 있습니다.\n카카오톡 채널 방문해주셔서 채팅으로 예약해주시면 됩니다.\n카카오톡에서 수상한렌탈 또는 아래 링크로 친구 추가 해주시고\n렌탈문의 부탁드립니다.\nhttp://pf.kakao.com/_xbxcxhhK',
    },
    {
      step: '02',
      title: 'Payment',
      subtitle: 'Account',
      body: '국민은행 830501-04-254913 / 주식회사 수상한렌탈',
      extraTitle: 'Payment information',
      extraBody:
        '세금계산서 발급을 통한 계좌이체 / 카드결제 / 계좌이체 가능합니다.\n홈페이지에 쓰여있는 금액은 vat 포함되어 있지 않는 금액입니다.',
    },
    {
      step: '03',
      title: 'Visit Us',
      subtitle: 'Address',
      body: '서울특별시 마포구 잔다리로3길 7 지하1층 101호 수상한렌탈',
      extraTitle: 'Opening Hours',
      extraBody:
        'All Day 7:00 am - 11:00 pm\n업무 시간외에 대여 및 반납은 무인으로 진행이 되어 지고 있으며 협의 하에 대여 전날 반출이 가능합니다.',
    },
  ],
  discountTextContent: {
    mainTitle: '할인 정보',
    mainSubtitle: '다양한 할인 혜택으로 더 저렴하게 이용하세요',
    independentTitle: '독립할인',
    independentBox1Title: '20% 적용',
    independentBox1Body:
      '독립작품은 렌탈 총액에 20% 적용됩니다.\n단 세금계산서 및 카드 결제가 불가합니다.',
    independentBox2Title: '서류 지참',
    independentBox2Body:
      '독립작품임을 증명 할 수 있는 서류 (시나리오 / 일촬표)를\n지참 후 렌탈시 보여주셔야 적용 가능합니다.',
    roundTitle: '회차할인',
    roundSubtitle: '장기렌탈은 아래 정해진 할인율을 적용하여 할인 진행하고 있습니다. / 2회차 부터 적용',
    prepayTitle: '선결제할인',
    prepayBody: '반출 전\n반납 당일까지 결제시 선결제할인 10% 적용됩니다.',
    regularTitle: '단골할인',
    regularBadge: 'NEW',
    regularBody: '누적 대여 건수 10회 이상 5% 추가 할인\n누적 대여 건수 15회 이상 10% 추가 할인',
    notesTitle: '유의사항',
    problemTitle: 'Problem',
    problemBody:
      '장비를 출고하기 전에 테스트를 통해 장비 작동의 이상 유/무를 확인 해야 합니다.\n이후에 발생되는 문제는 책임지지 않습니다.\n장비 파손시 이용약관에 따른 절차로 진행되어집니다.\n당일 예약 취소는 위약금 50%가 발생 됩니다.\n저희 렌탈샵은 24시간 cctv 녹화가 되어 지고 있어 장비 문제시 자료로 보여드릴 수 있습니다.',
    documentTitle: 'Document',
    documentBody: '첫 장비 대여시 신분증 / 사업자등록증이 필요합니다.\n서류제출 거부시 렌탈이 불가합니다.',
  },
  discountRoundColumns: [
    [
      ['01회차', '00%'],
      ['02회차', '05%'],
      ['03회차', '10%'],
      ['04회차', '15%'],
      ['05회차', '20%'],
    ],
    [
      ['06회차', '22%'],
      ['07회차', '24%'],
      ['08회차', '26%'],
      ['09회차', '28%'],
      ['10회차', '30%'],
    ],
    [
      ['11회차', '31%'],
      ['12회차', '32%'],
      ['13회차', '33%'],
      ['14회차', '34%'],
      ['15회차', '35%'],
    ],
    [
      ['16회차', '36%'],
      ['17회차', '37%'],
      ['18회차', '38%'],
      ['19회차', '39%'],
      ['20회차', '40%'],
    ],
  ],
  categoryItems: defaultCategoryItems,
  taxonomyCategories: ['set', 'camera', 'lens', 'support', 'grip', 'monitor', 'light', 'intercom'],
  taxonomySectionsByCategory: {
    set: ['ARRI', 'SONY', 'CANON'],
    camera: ['SONY', 'CANON', 'DJI'],
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

/** 카드 제목은 항상 한 줄 문자열로만 둠(저장된 \\n은 공백으로 합쳐 관리자/동기화 혼선 방지) */
function normalizeGuideCardTitle(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .trim()
}

function mapDefaultGuideCards() {
  return defaultContent.guideInfoCardTexts.map((entry) => ({
    title: normalizeGuideCardTitle(entry.title),
    body: String(entry.body || '').trim(),
    footer: String(entry.footer || '').trim(),
  }))
}

function normalizeGuideInfoCardTexts(value) {
  if (!Array.isArray(value) || !value.length) return mapDefaultGuideCards()
  const normalized = value
    .map((entry) => ({
      title: normalizeGuideCardTitle(entry.title),
      body: String(entry?.body || '').trim(),
      footer: String(entry?.footer || '').trim(),
    }))
    .filter((entry) => entry.title || entry.body || entry.footer)
  return normalized.length ? normalized : mapDefaultGuideCards()
}

function normalizeGuideSteps(value) {
  const fallback = defaultContent.guideSteps
  if (!Array.isArray(value) || !value.length) return fallback.map((entry) => ({ ...entry }))
  const normalized = value
    .map((entry, index) => ({
      step: String(entry?.step || fallback[index]?.step || `${index + 1}`).trim(),
      title: String(entry?.title || fallback[index]?.title || '').trim(),
      subtitle: String(entry?.subtitle || fallback[index]?.subtitle || '').trim(),
      body: String(entry?.body || fallback[index]?.body || '').trim(),
      extraTitle: String(entry?.extraTitle || fallback[index]?.extraTitle || '').trim(),
      extraBody: String(entry?.extraBody || fallback[index]?.extraBody || '').trim(),
    }))
    .filter((entry) => entry.step || entry.title || entry.subtitle || entry.body || entry.extraTitle || entry.extraBody)
  return normalized.length ? normalized : fallback.map((entry) => ({ ...entry }))
}

function normalizeDiscountTextContent(value) {
  const source = value && typeof value === 'object' ? value : {}
  const base = defaultContent.discountTextContent
  return Object.fromEntries(
    Object.keys(base).map((key) => [key, String(source[key] || '').trim() || base[key]]),
  )
}

function normalizeDiscountRoundColumns(value) {
  if (!Array.isArray(value) || !value.length) return [...defaultContent.discountRoundColumns]
  const normalized = value
    .map((column) => {
      if (!Array.isArray(column)) return []
      return column
        .map((row) => {
          if (!Array.isArray(row) || row.length < 2) return null
          const round = String(row[0] || '').trim()
          const rate = String(row[1] || '').trim()
          if (!round || !rate) return null
          return [round, rate]
        })
        .filter(Boolean)
    })
    .filter((column) => column.length)
  return normalized.length ? normalized : [...defaultContent.discountRoundColumns]
}

function encodeDiscountRoundColumnsForFirestore(value) {
  const normalized = normalizeDiscountRoundColumns(value)
  return normalized.map((column) => ({
    rows: (Array.isArray(column) ? column : [])
      .map((row) => {
        const round = String(row?.[0] || '').trim()
        const rate = String(row?.[1] || '').trim()
        if (!round || !rate) return null
        return { round, rate }
      })
      .filter(Boolean),
  }))
}

function decodeDiscountRoundColumnsFromFirestore(value) {
  if (!Array.isArray(value) || !value.length) return normalizeDiscountRoundColumns(value)
  const looksEncoded = value.every(
    (column) => column && typeof column === 'object' && !Array.isArray(column) && Array.isArray(column.rows),
  )
  if (!looksEncoded) return normalizeDiscountRoundColumns(value)
  const decoded = value.map((column) =>
    (Array.isArray(column.rows) ? column.rows : [])
      .map((row) => {
        const round = String(row?.round || '').trim()
        const rate = String(row?.rate || '').trim()
        if (!round || !rate) return null
        return [round, rate]
      })
      .filter(Boolean),
  )
  return normalizeDiscountRoundColumns(decoded)
}

function hasMeaningfulDiscountTextContent(value) {
  if (!value || typeof value !== 'object') return false
  return Object.values(value).some((entry) => String(entry || '').trim().length > 0)
}

function toUpdatedAtMs(value) {
  if (!value) return 0
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toMillis === 'function') return Number(value.toMillis() || 0)
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

  const mergedSections = {
    ...defaultContent.taxonomySectionsByCategory,
    ...(stored.taxonomySectionsByCategory || {}),
  }
  if (
    Array.isArray(mergedSections.set) &&
    mergedSections.set.length === 1 &&
    String(mergedSections.set[0]).toUpperCase() === 'SET'
  ) {
    mergedSections.set = [...defaultContent.taxonomySectionsByCategory.set]
  }
  if (
    Array.isArray(mergedSections.camera) &&
    mergedSections.camera.length === 1 &&
    String(mergedSections.camera[0]).toUpperCase() === 'CAMERA'
  ) {
    mergedSections.camera = [...defaultContent.taxonomySectionsByCategory.camera]
  }

  const storedBannerImages = Array.isArray(stored.heroBannerImages)
    ? stored.heroBannerImages.map((url) => String(url || '').trim()).filter(Boolean)
    : []
  const mergedHeroBannerImages = storedBannerImages.length
    ? storedBannerImages
    : [stored.heroBannerImageUrl || defaultContent.heroBannerImageUrl]
  const heroBannerImageUrl = mergedHeroBannerImages[0] || defaultContent.heroBannerImageUrl
  const storedBannerImagesMobile = Array.isArray(stored.heroBannerImagesMobile)
    ? stored.heroBannerImagesMobile.map((url) => String(url || '').trim()).filter(Boolean)
    : []
  const storedBannerTitle = String(stored.heroBannerTitle || '').trim()
  const storedBannerDescriptionLines = Array.isArray(stored.heroBannerDescriptionLines)
    ? stored.heroBannerDescriptionLines.map((line) => String(line || '').trim()).filter(Boolean)
    : []

  const guideInfoCardTexts = normalizeGuideInfoCardTexts(stored.guideInfoCardTexts)
  const guideSteps = normalizeGuideSteps(stored.guideSteps)
  const discountTextContent = normalizeDiscountTextContent(stored.discountTextContent)
  const discountRoundColumns = normalizeDiscountRoundColumns(stored.discountRoundColumns)

  return {
    contentUpdatedAt: Number(stored.contentUpdatedAt || 0),
    heroBannerImageUrl,
    heroBannerImages: mergedHeroBannerImages,
    heroBannerImagesMobile: storedBannerImagesMobile,
    heroBannerTitle: storedBannerTitle || defaultContent.heroBannerTitle,
    heroBannerDescriptionLines: storedBannerDescriptionLines.length
      ? storedBannerDescriptionLines
      : [...defaultContent.heroBannerDescriptionLines],
    guideInfoCardTexts,
    guideSteps,
    discountTextContent,
    discountRoundColumns,
    categoryItems: mergeCategoryItems(stored.categoryItems || []),
    taxonomyCategories:
      Array.isArray(stored.taxonomyCategories) && stored.taxonomyCategories.length
        ? stored.taxonomyCategories
        : defaultContent.taxonomyCategories,
    taxonomySectionsByCategory: mergedSections,
    arrivalItems: Array.isArray(stored.arrivalItems) && stored.arrivalItems.length ? stored.arrivalItems : defaultContent.arrivalItems,
  }
}

const initial = getInitialContent()

const state = reactive({
  contentUpdatedAt: Number(initial.contentUpdatedAt || 0),
  heroBannerImageUrl: initial.heroBannerImageUrl,
  heroBannerImages: [...(initial.heroBannerImages || [initial.heroBannerImageUrl])],
  heroBannerImagesMobile: [...(initial.heroBannerImagesMobile || [])],
  heroBannerTitle: initial.heroBannerTitle || defaultContent.heroBannerTitle,
  heroBannerDescriptionLines: [
    ...(initial.heroBannerDescriptionLines?.length
      ? initial.heroBannerDescriptionLines
      : defaultContent.heroBannerDescriptionLines),
  ],
  guideInfoCardTexts: normalizeGuideInfoCardTexts(initial.guideInfoCardTexts),
  guideSteps: normalizeGuideSteps(initial.guideSteps),
  discountTextContent: normalizeDiscountTextContent(initial.discountTextContent),
  discountRoundColumns: normalizeDiscountRoundColumns(initial.discountRoundColumns),
  categoryItems: [...initial.categoryItems],
  taxonomyCategories: [...initial.taxonomyCategories],
  taxonomySectionsByCategory: { ...initial.taxonomySectionsByCategory },
  arrivalItems: [...initial.arrivalItems],
})

function persist() {
  localStorage.setItem(
    CONTENT_STORAGE_KEY,
    JSON.stringify({
      contentUpdatedAt: state.contentUpdatedAt,
      heroBannerImageUrl: state.heroBannerImageUrl,
      heroBannerImages: state.heroBannerImages,
      heroBannerImagesMobile: state.heroBannerImagesMobile,
      heroBannerTitle: state.heroBannerTitle,
      heroBannerDescriptionLines: state.heroBannerDescriptionLines,
      guideInfoCardTexts: state.guideInfoCardTexts,
      guideSteps: state.guideSteps,
      discountTextContent: state.discountTextContent,
      discountRoundColumns: state.discountRoundColumns,
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

/** 모든 기기에서 동일한 배너가 보이도록 Firestore에도 동기화 */
function persistHeroBannersRemote() {
  if (!db) {
    persist()
    return Promise.resolve()
  }
  const nextUpdatedAt = Math.max(Date.now(), Number(state.contentUpdatedAt || 0))
  state.contentUpdatedAt = nextUpdatedAt
  persist()
  const payload = {
    heroBannerImages: [...state.heroBannerImages],
    heroBannerImagesMobile: [...state.heroBannerImagesMobile],
    heroBannerTitle: state.heroBannerTitle,
    heroBannerDescriptionLines: [...state.heroBannerDescriptionLines],
    guideInfoCardTexts: [...state.guideInfoCardTexts],
    guideSteps: [...state.guideSteps],
    discountTextContent: { ...state.discountTextContent },
    discountRoundColumns: encodeDiscountRoundColumnsForFirestore(state.discountRoundColumns),
    updatedAt: nextUpdatedAt,
  }
  const task = lastRemoteWritePromise
    .catch(() => {})
    .then(() => setDoc(doc(db, SITE_SETTINGS_COLLECTION, HERO_BANNER_DOC_ID), payload, { merge: true }))
  lastRemoteWritePromise = task
  return task
    .then(() => {})
    .catch((err) => {
      console.warn('[siteSettings/hero] Firestore 저장 실패 — 규칙·로그인·네트워크를 확인하세요.', err?.message || err)
      throw err
    })
}

/** Firestore 문서 데이터 → state (문서가 있으면 PC·모바일 모두 덮어씀; 필드 없으면 빈 배열로 정리) */
function applyHeroBannerRemoteData(data) {
  if (!data || typeof data !== 'object') return
  const remoteUpdatedAt = toUpdatedAtMs(data.updatedAt)

  const hasKey = (key) => Object.prototype.hasOwnProperty.call(data, key)

  if (hasKey('heroBannerImages')) {
    const pcRaw = Array.isArray(data.heroBannerImages) ? data.heroBannerImages : []
    const remotePc = pcRaw.map((url) => String(url || '').trim()).filter(Boolean)
    state.heroBannerImages = remotePc.length ? remotePc : [...defaultContent.heroBannerImages]
    state.heroBannerImageUrl = state.heroBannerImages[0] || defaultContent.heroBannerImageUrl
  } else if (hasKey('heroBannerImageUrl')) {
    const single = String(data.heroBannerImageUrl || '').trim()
    if (single) {
      state.heroBannerImageUrl = single
      state.heroBannerImages = [single, ...state.heroBannerImages.filter((url) => url !== single)]
    }
  }

  if (hasKey('heroBannerImagesMobile')) {
    const mobileRaw = Array.isArray(data.heroBannerImagesMobile) ? data.heroBannerImagesMobile : []
    state.heroBannerImagesMobile = mobileRaw.map((url) => String(url || '').trim()).filter(Boolean)
  }
  if (hasKey('heroBannerTitle')) {
    const titleRaw = String(data.heroBannerTitle || '').trim()
    state.heroBannerTitle = titleRaw || defaultContent.heroBannerTitle
  }
  if (hasKey('heroBannerDescriptionLines')) {
    const descriptionRaw = Array.isArray(data.heroBannerDescriptionLines)
      ? data.heroBannerDescriptionLines
      : []
    const nextDescription = descriptionRaw.map((line) => String(line || '').trim()).filter(Boolean)
    state.heroBannerDescriptionLines = nextDescription.length
      ? nextDescription
      : [...defaultContent.heroBannerDescriptionLines]
  }
  // 필드가 없거나 빈 배열이면 기본 카드(제목에 \\n 포함)로 덮어쓰지 않음 — 로컬 저장·이전 state 유지
  if (Array.isArray(data.guideInfoCardTexts) && data.guideInfoCardTexts.length > 0) {
    state.guideInfoCardTexts = normalizeGuideInfoCardTexts(data.guideInfoCardTexts)
  }
  if (Array.isArray(data.guideSteps) && data.guideSteps.length > 0) {
    state.guideSteps = normalizeGuideSteps(data.guideSteps)
  }
  // 원격 문서에 필드가 비어있거나 누락된 경우, 이미 편집/저장된 로컬 state를 기본값으로 덮어쓰지 않음.
  if (hasMeaningfulDiscountTextContent(data.discountTextContent)) {
    state.discountTextContent = normalizeDiscountTextContent(data.discountTextContent)
  }
  if (Array.isArray(data.discountRoundColumns) && data.discountRoundColumns.length > 0) {
    state.discountRoundColumns = decodeDiscountRoundColumnsFromFirestore(data.discountRoundColumns)
  }

  if (remoteUpdatedAt > 0) {
    state.contentUpdatedAt = remoteUpdatedAt
  } else if (Number(state.contentUpdatedAt || 0) <= 0) {
    state.contentUpdatedAt = Date.now()
  }
  persist()
}

async function fetchHeroBannersOnce() {
  if (!db) return
  try {
    const snap = await getDoc(doc(db, SITE_SETTINGS_COLLECTION, HERO_BANNER_DOC_ID))
    if (snap.exists()) applyHeroBannerRemoteData(snap.data())
  } catch (err) {
    console.warn('[siteSettings/hero] 초기 로드 실패', err?.message || err)
  }
}

let unsubscribeHeroBanners = null
let heroBannerRemoteSubscribed = false
let lastRemoteWritePromise = Promise.resolve()

function subscribeHeroBannersRemote() {
  if (!db || heroBannerRemoteSubscribed) return
  heroBannerRemoteSubscribed = true

  void fetchHeroBannersOnce()

  unsubscribeHeroBanners = onSnapshot(
    doc(db, SITE_SETTINGS_COLLECTION, HERO_BANNER_DOC_ID),
    (snapshot) => {
      if (!snapshot.exists()) return
      applyHeroBannerRemoteData(snapshot.data())
    },
    (err) => {
      console.warn('[siteSettings/hero] 실시간 구독 오류', err?.message || err)
    },
  )
}

function updateHeroBannerImage(imageUrl) {
  const next = String(imageUrl || '').trim() || defaultContent.heroBannerImageUrl
  state.heroBannerImageUrl = next
  if (!Array.isArray(state.heroBannerImages) || !state.heroBannerImages.length) {
    state.heroBannerImages = [next]
  } else {
    state.heroBannerImages = [next, ...state.heroBannerImages.slice(1)]
  }
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateHeroBannerImages(images = []) {
  const next = Array.isArray(images)
    ? images.map((url) => String(url || '').trim()).filter(Boolean)
    : []
  state.heroBannerImages = next.length ? next : [...defaultContent.heroBannerImages]
  state.heroBannerImageUrl = state.heroBannerImages[0] || defaultContent.heroBannerImageUrl
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateHeroBannerImagesMobile(images = []) {
  const next = Array.isArray(images)
    ? images.map((url) => String(url || '').trim()).filter(Boolean)
    : []
  state.heroBannerImagesMobile = next
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateHeroBannerText(title = '', descriptionLines = []) {
  const nextTitle = String(title || '').trim() || defaultContent.heroBannerTitle
  const nextDescription = Array.isArray(descriptionLines)
    ? descriptionLines.map((line) => String(line || '').trim()).filter(Boolean)
    : []
  state.heroBannerTitle = nextTitle
  state.heroBannerDescriptionLines = nextDescription.length
    ? nextDescription
    : [...defaultContent.heroBannerDescriptionLines]
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateGuideInfoCardTexts(cards = []) {
  state.guideInfoCardTexts = normalizeGuideInfoCardTexts(cards)
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateGuideSteps(steps = []) {
  state.guideSteps = normalizeGuideSteps(steps)
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateDiscountTextContent(content = {}) {
  state.discountTextContent = normalizeDiscountTextContent(content)
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

function updateDiscountRoundColumns(columns = []) {
  state.discountRoundColumns = normalizeDiscountRoundColumns(columns)
  state.contentUpdatedAt = Date.now()
  persist()
  return persistHeroBannersRemote()
}

subscribeHeroBannersRemote()

export function useContentStore() {
  return {
    state,
    addArrivalItem,
    removeArrivalItem,
    updateCategoryImage,
    updateCategoryItems,
    saveTaxonomyConfig,
    updateHeroBannerImage,
    updateHeroBannerImages,
    updateHeroBannerImagesMobile,
    updateHeroBannerText,
    updateGuideInfoCardTexts,
    updateGuideSteps,
    updateDiscountTextContent,
    updateDiscountRoundColumns,
  }
}
